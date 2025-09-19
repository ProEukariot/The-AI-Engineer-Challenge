# Merge Instructions for Feature: Remove General Chat Tab

## Overview
This feature removes the general chat functionality from the application, focusing solely on PDF RAG (Retrieval-Augmented Generation) chat capabilities.

## Changes Made
- **Frontend**: Removed general chat tab, UI components, and state management
- **Backend**: Removed general chat API endpoint and related Pydantic models
- **Documentation**: Updated README to reflect PDF RAG focus
- **UI/UX**: Simplified interface to focus on PDF upload and chat functionality

## Merge Instructions

### Option 1: GitHub Pull Request (Recommended)
1. Push the feature branch to GitHub:
   ```bash
   git push origin feature/remove-general-chat-tab
   ```

2. Create a Pull Request on GitHub:
   - Go to the repository on GitHub
   - Click "Compare & pull request" for the `feature/remove-general-chat-tab` branch
   - Add a descriptive title: "Remove general chat tab and focus on PDF RAG only"
   - Add description explaining the changes
   - Request review from team members if applicable
   - Merge the PR once approved

### Option 2: GitHub CLI
1. Push the feature branch:
   ```bash
   git push origin feature/remove-general-chat-tab
   ```

2. Create and merge the PR using GitHub CLI:
   ```bash
   # Create the PR
   gh pr create --title "Remove general chat tab and focus on PDF RAG only" \
     --body "This PR removes the general chat functionality and focuses the application on PDF RAG capabilities only. Changes include:
     - Removed general chat tab and UI components
     - Removed general chat API endpoint
     - Simplified state management
     - Updated documentation
     - Improved UX for PDF-focused workflow"

   # Merge the PR (after review)
   gh pr merge --squash
   ```

### Option 3: Direct Merge (Not Recommended for Production)
If you need to merge directly without a PR:
```bash
# Switch to main branch
git checkout main

# Merge the feature branch
git merge --squash feature/remove-general-chat-tab

# Commit the merge
git commit -m "Merge feature: Remove general chat tab and focus on PDF RAG only"

# Push to main
git push origin main

# Delete the feature branch
git branch -d feature/remove-general-chat-tab
git push origin --delete feature/remove-general-chat-tab
```

## Testing After Merge
1. **Frontend Testing**:
   - Verify PDF upload functionality works
   - Test PDF selection and RAG chat
   - Ensure UI is clean and focused on PDF functionality

2. **Backend Testing**:
   - Test PDF upload endpoint (`/api/upload-pdf`)
   - Test RAG chat endpoint (`/api/rag-chat`)
   - Verify health check endpoint (`/api/health`)
   - Ensure general chat endpoint is no longer available

3. **Integration Testing**:
   - Test complete PDF upload to chat workflow
   - Verify error handling for missing PDFs
   - Test with multiple PDFs

## Rollback Plan
If issues are discovered after merge:
1. Revert the merge commit:
   ```bash
   git revert <merge-commit-hash>
   ```
2. Or create a hotfix branch to restore general chat functionality if needed

## Files Modified
- `frontend/app/page.tsx` - Removed general chat UI and state
- `api/app.py` - Removed general chat endpoint and models
- `api/README.md` - Updated documentation

## Breaking Changes
- **API**: `/api/chat` endpoint has been removed
- **Frontend**: General chat tab and functionality removed
- **User Experience**: Users can no longer chat with the LLM directly without a PDF

## Benefits
- Simplified user interface focused on PDF RAG use case
- Reduced code complexity and maintenance overhead
- Clearer user workflow for PDF-based interactions
- Better performance due to removed unused functionality