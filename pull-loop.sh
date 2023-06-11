#!/bin/bash

# Set your repository location
REPO_PATH="."

# Set your desired branch
BRANCH="main"

# Change to the repository location
cd $REPO_PATH

# Loop indefinitely
while true; do
    echo "Pulling latest updates from the $BRANCH branch."
    
    # Fetch the latest updates from origin
    git fetch origin

    # Reset the current branch to match the fetched origin/branch
    git reset --hard origin/$BRANCH
    
    # Sleep for 1 hour (3600 seconds) before the next pull
    sleep 5
done
