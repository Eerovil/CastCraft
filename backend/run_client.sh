#!/bin/bash

# Specify the command to run your application
CMD="python3 server_client.py"

# Run the command and get its process
while true; do
    echo "Starting the application..."
    $CMD
    
    # If the command crashes, this line will be executed
    echo "The application has crashed. Restarting in 5 seconds..."
    
    # Wait for 5 seconds before restarting
    sleep 1
done
