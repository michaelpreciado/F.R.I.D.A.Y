#!/bin/bash
# Simple development proxy script to forward HTTPS traffic to the backend

# Default values
PORT=5173
BACKEND_URL="http://localhost:8000"

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --port) PORT="$2"; shift ;;
        --backend) BACKEND_URL="$2"; shift ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

echo "Starting development proxy..."
echo "Frontend port: $PORT"
echo "Backend URL: $BACKEND_URL"

# Check if mkcert is installed for local HTTPS
if command -v mkcert &> /dev/null; then
    echo "mkcert found, setting up local HTTPS"
    
    # Create certs directory if it doesn't exist
    mkdir -p ./.certs
    
    # Generate certificates
    mkcert -install
    mkcert -key-file ./.certs/key.pem -cert-file ./.certs/cert.pem localhost 127.0.0.1
    
    # Use local-ssl-proxy to create HTTPS proxy
    if ! command -v local-ssl-proxy &> /dev/null; then
        echo "Installing local-ssl-proxy..."
        npm install -g local-ssl-proxy
    fi
    
    # Start proxy
    local-ssl-proxy --source $PORT --target 5173 --cert ./.certs/cert.pem --key ./.certs/key.pem
else
    echo "mkcert not found. For HTTPS development, install mkcert:"
    echo "  brew install mkcert"
    echo ""
    echo "Continuing with standard HTTP..."
    
    # Use http-proxy for simple HTTP forwarding
    if ! command -v http-server &> /dev/null; then
        echo "Installing http-server..."
        npm install -g http-server
    fi
    
    # Start proxy
    http-server -p $PORT -P $BACKEND_URL
fi
