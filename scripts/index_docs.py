#!/usr/bin/env python3
"""
Script to build a Chroma vector store from documents in ~/Documents/RAG
"""

import os
import sys
import argparse
from pathlib import Path
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Try to import required packages, install if missing
try:
    import chromadb
    from langchain.document_loaders import DirectoryLoader, TextLoader, PDFLoader
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    from langchain.embeddings import HuggingFaceEmbeddings
    from langchain.vectorstores import Chroma
except ImportError:
    logger.info("Installing required packages...")
    os.system("pip install chromadb langchain langchain-community sentence-transformers pypdf")
    import chromadb
    from langchain.document_loaders import DirectoryLoader, TextLoader, PDFLoader
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    from langchain.embeddings import HuggingFaceEmbeddings
    from langchain.vectorstores import Chroma

def parse_args():
    parser = argparse.ArgumentParser(description="Index documents for RAG")
    parser.add_argument("--docs-dir", type=str, default=os.path.expanduser("~/Documents/RAG"),
                      help="Directory containing documents to index")
    parser.add_argument("--db-dir", type=str, default="./chroma_db",
                      help="Directory to store the Chroma database")
    parser.add_argument("--chunk-size", type=int, default=1000,
                      help="Size of text chunks")
    parser.add_argument("--chunk-overlap", type=int, default=200,
                      help="Overlap between chunks")
    return parser.parse_args()

def main():
    args = parse_args()
    
    # Check if docs directory exists
    docs_path = Path(args.docs_dir)
    if not docs_path.exists():
        logger.error(f"Documents directory {docs_path} does not exist")
        logger.info(f"Creating {docs_path}")
        docs_path.mkdir(parents=True, exist_ok=True)
        
    # Create database directory if it doesn't exist
    db_path = Path(args.db_dir)
    db_path.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"Indexing documents from {docs_path}")
    
    # Load documents
    loaders = []
    
    # Text files
    if list(docs_path.glob("**/*.txt")):
        text_loader = DirectoryLoader(
            str(docs_path),
            glob="**/*.txt",
            loader_cls=TextLoader
        )
        loaders.append(text_loader)
    
    # PDF files
    if list(docs_path.glob("**/*.pdf")):
        pdf_loader = DirectoryLoader(
            str(docs_path),
            glob="**/*.pdf",
            loader_cls=PDFLoader
        )
        loaders.append(pdf_loader)
    
    # Check if we have any documents to load
    if not loaders:
        logger.warning(f"No supported documents found in {docs_path}")
        logger.info(f"Please add .txt or .pdf files to {docs_path}")
        return
    
    # Load all documents
    documents = []
    for loader in loaders:
        documents.extend(loader.load())
    
    logger.info(f"Loaded {len(documents)} documents")
    
    # Split documents into chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=args.chunk_size,
        chunk_overlap=args.chunk_overlap
    )
    chunks = text_splitter.split_documents(documents)
    
    logger.info(f"Split into {len(chunks)} chunks")
    
    # Create embeddings
    logger.info("Loading embedding model (this might take a moment)...")
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    # Create and persist vector store
    logger.info(f"Creating vector store in {db_path}")
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=str(db_path)
    )
    
    logger.info("Indexing complete!")
    logger.info(f"Vector store created with {len(chunks)} chunks")

if __name__ == "__main__":
    main()
