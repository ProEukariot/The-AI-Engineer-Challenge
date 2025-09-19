"""
Web scraping utility for extracting text content from web pages.
This module provides functionality to scrape web pages and extract clean text
for use in RAG (Retrieval-Augmented Generation) pipelines.
"""

import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
import re
from typing import List, Dict, Optional
import time
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WebScraper:
    """
    A web scraper that extracts clean text content from web pages.
    """
    
    def __init__(self, timeout: int = 30, max_retries: int = 3):
        """
        Initialize the web scraper.
        
        Args:
            timeout: Request timeout in seconds
            max_retries: Maximum number of retry attempts
        """
        self.timeout = timeout
        self.max_retries = max_retries
        self.session = requests.Session()
        
        # Set headers to mimic a real browser
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
    
    def is_valid_url(self, url: str) -> bool:
        """
        Check if the provided URL is valid.
        
        Args:
            url: URL to validate
            
        Returns:
            True if URL is valid, False otherwise
        """
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except Exception:
            return False
    
    def clean_text(self, text: str) -> str:
        """
        Clean and normalize extracted text.
        
        Args:
            text: Raw text to clean
            
        Returns:
            Cleaned text
        """
        if not text:
            return ""
        
        # Remove extra whitespace and normalize
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        
        # Remove common unwanted patterns
        text = re.sub(r'^\s*[•\-\*]\s*', '', text, flags=re.MULTILINE)
        text = re.sub(r'\n\s*\n', '\n\n', text)
        
        return text
    
    def extract_text_from_html(self, html_content: str, url: str) -> Dict[str, any]:
        """
        Extract text content from HTML.
        
        Args:
            html_content: Raw HTML content
            url: Source URL for context
            
        Returns:
            Dictionary containing extracted content and metadata
        """
        try:
            soup = BeautifulSoup(html_content, 'lxml')
            
            # Remove script and style elements
            for script in soup(["script", "style", "nav", "footer", "header", "aside"]):
                script.decompose()
            
            # Extract title
            title = ""
            title_tag = soup.find('title')
            if title_tag:
                title = self.clean_text(title_tag.get_text())
            
            # Extract main content
            content = ""
            
            # Try to find main content area
            main_content = soup.find('main') or soup.find('article') or soup.find('div', class_=re.compile(r'content|main|body', re.I))
            
            if main_content:
                content = main_content.get_text()
            else:
                # Fallback to body content
                body = soup.find('body')
                if body:
                    content = body.get_text()
                else:
                    content = soup.get_text()
            
            # Clean the extracted content
            content = self.clean_text(content)
            
            # Extract headings for structure
            headings = []
            for heading in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
                heading_text = self.clean_text(heading.get_text())
                if heading_text:
                    headings.append({
                        'level': int(heading.name[1]),
                        'text': heading_text
                    })
            
            # Extract links for context
            links = []
            for link in soup.find_all('a', href=True):
                link_text = self.clean_text(link.get_text())
                link_url = urljoin(url, link['href'])
                if link_text and link_url:
                    links.append({
                        'text': link_text,
                        'url': link_url
                    })
            
            return {
                'title': title,
                'content': content,
                'headings': headings,
                'links': links,
                'url': url,
                'word_count': len(content.split()),
                'char_count': len(content)
            }
            
        except Exception as e:
            logger.error(f"Error extracting text from HTML: {str(e)}")
            return {
                'title': '',
                'content': '',
                'headings': [],
                'links': [],
                'url': url,
                'word_count': 0,
                'char_count': 0,
                'error': str(e)
            }
    
    def scrape_url(self, url: str) -> Dict[str, any]:
        """
        Scrape a single URL and extract text content.
        
        Args:
            url: URL to scrape
            
        Returns:
            Dictionary containing scraped content and metadata
        """
        if not self.is_valid_url(url):
            return {
                'error': 'Invalid URL format',
                'url': url,
                'content': '',
                'title': ''
            }
        
        for attempt in range(self.max_retries):
            try:
                logger.info(f"Scraping URL (attempt {attempt + 1}): {url}")
                
                response = self.session.get(url, timeout=self.timeout)
                response.raise_for_status()
                
                # Check if content is HTML
                content_type = response.headers.get('content-type', '').lower()
                if 'text/html' not in content_type:
                    return {
                        'error': f'URL does not contain HTML content. Content-Type: {content_type}',
                        'url': url,
                        'content': '',
                        'title': ''
                    }
                
                # Extract text from HTML
                result = self.extract_text_from_html(response.text, url)
                
                if result.get('content'):
                    logger.info(f"Successfully scraped {url}: {result['word_count']} words")
                    return result
                else:
                    logger.warning(f"No content extracted from {url}")
                    return result
                    
            except requests.exceptions.RequestException as e:
                logger.warning(f"Request failed (attempt {attempt + 1}): {str(e)}")
                if attempt < self.max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    return {
                        'error': f'Failed to fetch URL after {self.max_retries} attempts: {str(e)}',
                        'url': url,
                        'content': '',
                        'title': ''
                    }
            except Exception as e:
                logger.error(f"Unexpected error scraping {url}: {str(e)}")
                return {
                    'error': f'Unexpected error: {str(e)}',
                    'url': url,
                    'content': '',
                    'title': ''
                }
        
        return {
            'error': 'Max retries exceeded',
            'url': url,
            'content': '',
            'title': ''
        }
    
    def scrape_multiple_urls(self, urls: List[str]) -> List[Dict[str, any]]:
        """
        Scrape multiple URLs.
        
        Args:
            urls: List of URLs to scrape
            
        Returns:
            List of dictionaries containing scraped content for each URL
        """
        results = []
        for url in urls:
            result = self.scrape_url(url)
            results.append(result)
            # Small delay between requests to be respectful
            time.sleep(1)
        
        return results

# Convenience function for simple usage
def scrape_webpage(url: str) -> Dict[str, any]:
    """
    Simple function to scrape a single webpage.
    
    Args:
        url: URL to scrape
        
    Returns:
        Dictionary containing scraped content and metadata
    """
    scraper = WebScraper()
    return scraper.scrape_url(url)
