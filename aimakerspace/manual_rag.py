"""
Specialized RAG system for user manual Q&A.

This module provides components specifically designed for answering questions
from user manuals, technical documentation, and instruction guides.
"""

import re
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import PyPDF2
from dataclasses import dataclass

from .text_utils import PDFLoader, CharacterTextSplitter
from .vectordatabase import VectorDatabase
from .openai_utils.embedding import EmbeddingModel


@dataclass
class ManualSection:
    """Represents a section of a manual with metadata."""
    title: str
    content: str
    page_number: Optional[int] = None
    section_type: str = "general"  # general, procedure, troubleshooting, specification
    subsection: Optional[str] = None


class ManualParser:
    """
    Specialized parser for user manuals that preserves structure and context.
    
    This parser is designed to handle:
    - Table of contents detection
    - Section and subsection identification
    - Procedure steps preservation
    - Troubleshooting sections
    - Technical specifications
    """
    
    def __init__(self, chunk_size: int = 800, chunk_overlap: int = 150):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        
        # Common manual section patterns
        self.section_patterns = [
            r'^\s*(?:Chapter|Section|Part)\s+\d+[\.\-\s]+(.+)$',
            r'^\s*\d+[\.\-\s]+(.+)$',
            r'^\s*[A-Z][A-Z\s]+:?\s*$',  # ALL CAPS headers
            r'^\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*:?\s*$',  # Title Case headers
        ]
        
        # Procedure patterns
        self.procedure_patterns = [
            r'^\s*(?:Step|Procedure|Instructions?)\s*\d*[\.\-\s]*',
            r'^\s*\d+[\.\)]\s+',  # Numbered lists
            r'^\s*[•\-\*]\s+',  # Bullet points
        ]
        
        # Troubleshooting patterns
        self.troubleshooting_patterns = [
            r'troubleshoot',
            r'problem',
            r'issue',
            r'error',
            r'fix',
            r'solution',
            r'common issues',
            r'faq',
        ]

    def parse_pdf(self, pdf_path: str) -> List[ManualSection]:
        """Parse a PDF manual into structured sections."""
        pdf_loader = PDFLoader(pdf_path)
        pdf_loader.load_file()
        
        if not pdf_loader.documents:
            return []
        
        # Combine all pages
        full_text = "\n".join(pdf_loader.documents)
        
        # Split into pages for page number tracking
        pages = pdf_loader.documents
        
        sections = []
        current_section = None
        current_content = []
        page_num = 0
        
        lines = full_text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check if this is a new section
            section_match = self._is_section_header(line)
            if section_match:
                # Save previous section
                if current_section and current_content:
                    sections.append(ManualSection(
                        title=current_section,
                        content='\n'.join(current_content),
                        page_number=page_num,
                        section_type=self._classify_section(current_section, current_content)
                    ))
                
                # Start new section
                current_section = section_match
                current_content = [line]
            else:
                current_content.append(line)
                
            # Simple page tracking (approximate)
            if 'page' in line.lower() and any(char.isdigit() for char in line):
                page_num += 1
        
        # Add final section
        if current_section and current_content:
            sections.append(ManualSection(
                title=current_section,
                content='\n'.join(current_content),
                page_number=page_num,
                section_type=self._classify_section(current_section, current_content)
            ))
        
        return sections

    def _is_section_header(self, line: str) -> Optional[str]:
        """Check if a line is a section header."""
        for pattern in self.section_patterns:
            match = re.match(pattern, line, re.IGNORECASE)
            if match:
                return match.group(1).strip() if match.groups() else line.strip()
        return None

    def _classify_section(self, title: str, content: List[str]) -> str:
        """Classify the type of section based on title and content."""
        title_lower = title.lower()
        content_text = ' '.join(content).lower()
        
        if any(pattern in title_lower for pattern in self.troubleshooting_patterns):
            return "troubleshooting"
        elif any(pattern in title_lower for pattern in ['procedure', 'step', 'instruction', 'how to']):
            return "procedure"
        elif any(pattern in title_lower for pattern in ['specification', 'technical', 'specs']):
            return "specification"
        elif any(pattern in content_text for pattern in self.procedure_patterns):
            return "procedure"
        else:
            return "general"

    def create_chunks(self, sections: List[ManualSection]) -> List[Dict[str, Any]]:
        """Create chunks from manual sections with enhanced metadata."""
        chunks = []
        
        for section in sections:
            # Split section content into chunks
            splitter = CharacterTextSplitter(
                chunk_size=self.chunk_size,
                chunk_overlap=self.chunk_overlap
            )
            section_chunks = splitter.split(section.content)
            
            for i, chunk in enumerate(section_chunks):
                chunk_data = {
                    'content': chunk,
                    'title': section.title,
                    'section_type': section.section_type,
                    'page_number': section.page_number,
                    'subsection': section.subsection,
                    'chunk_index': i,
                    'total_chunks': len(section_chunks),
                    'metadata': {
                        'is_procedure': section.section_type == "procedure",
                        'is_troubleshooting': section.section_type == "troubleshooting",
                        'is_specification': section.section_type == "specification",
                        'section_title': section.title,
                    }
                }
                chunks.append(chunk_data)
        
        return chunks


class ManualRAGSystem:
    """
    Complete RAG system specialized for user manual Q&A.
    
    Features:
    - Manual-specific chunking and parsing
    - Enhanced context retrieval
    - Specialized prompts for technical documentation
    - Better handling of procedures and troubleshooting
    """
    
    def __init__(self, embedding_model: Optional[EmbeddingModel] = None):
        self.embedding_model = embedding_model or EmbeddingModel()
        self.vector_db = VectorDatabase(self.embedding_model)
        self.manual_parser = ManualParser()
        self.manuals: Dict[str, Dict[str, Any]] = {}
        
    async def load_manual(self, pdf_path: str, manual_id: str) -> Dict[str, Any]:
        """Load and process a manual for RAG queries."""
        # Parse the manual
        sections = self.manual_parser.parse_pdf(pdf_path)
        chunks = self.manual_parser.create_chunks(sections)
        
        # Create embeddings for chunks
        chunk_texts = [chunk['content'] for chunk in chunks]
        embeddings = await self.embedding_model.async_get_embeddings(chunk_texts)
        
        # Store in vector database
        for chunk, embedding in zip(chunks, embeddings):
            chunk_key = f"{manual_id}_{chunk['chunk_index']}"
            self.vector_db.insert(chunk_key, embedding)
        
        # Store manual metadata
        self.manuals[manual_id] = {
            'chunks': chunks,
            'sections': sections,
            'pdf_path': pdf_path,
            'total_chunks': len(chunks)
        }
        
        return {
            'manual_id': manual_id,
            'total_chunks': len(chunks),
            'sections_count': len(sections),
            'sections': [{'title': s.title, 'type': s.section_type} for s in sections]
        }
    
    def search_manual(self, query: str, manual_id: str, k: int = 5) -> List[Dict[str, Any]]:
        """Search for relevant chunks in a specific manual."""
        if manual_id not in self.manuals:
            raise ValueError(f"Manual {manual_id} not found")
        
        # Search vector database
        query_vector = self.embedding_model.get_embedding(query)
        results = self.vector_db.search(query_vector, k)
        
        # Get chunk details
        relevant_chunks = []
        for chunk_key, similarity in results:
            if chunk_key.startswith(f"{manual_id}_"):
                chunk_index = int(chunk_key.split('_')[-1])
                chunk_data = self.manuals[manual_id]['chunks'][chunk_index]
                chunk_data['similarity'] = similarity
                relevant_chunks.append(chunk_data)
        
        return relevant_chunks
    
    def generate_answer(self, query: str, manual_id: str, model: str = "gpt-4") -> str:
        """Generate an answer using the manual context."""
        # Get relevant chunks
        relevant_chunks = self.search_manual(query, manual_id, k=5)
        
        if not relevant_chunks:
            return "I couldn't find relevant information in the manual for your question."
        
        # Create context
        context_parts = []
        for chunk in relevant_chunks:
            context_parts.append(f"Section: {chunk['title']}\nContent: {chunk['content']}")
        
        context = "\n\n".join(context_parts)
        
        # Create specialized prompt for manual Q&A
        system_prompt = self._create_manual_system_prompt(context)
        
        # Generate response (this would typically use OpenAI API)
        # For now, return a placeholder
        return f"Based on the manual, here's what I found:\n\n{context[:500]}..."
    
    def _create_manual_system_prompt(self, context: str) -> str:
        """Create a specialized system prompt for manual Q&A."""
        return f"""You are a helpful assistant specialized in answering questions from user manuals and technical documentation.

IMPORTANT INSTRUCTIONS:
- Answer questions using ONLY the information provided in the context below
- If the answer cannot be found in the context, clearly state "I cannot find that information in the manual"
- For procedures, provide step-by-step instructions in the exact order they appear
- For troubleshooting, be specific about the problem and solution
- Include relevant section titles and page numbers when available
- Be precise and technical when appropriate
- If you're unsure about something, say so rather than guessing

CONTEXT FROM THE MANUAL:
{context}

Please answer the user's question based on the above context from the manual."""


# Example usage and testing
if __name__ == "__main__":
    # This would be used for testing the manual RAG system
    pass
