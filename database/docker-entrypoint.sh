#!/bin/sh
# Start DynamoDB Local in the background
java -jar /home/dynamodblocal/DynamoDBLocal.jar -sharedDb -port 8001 &

# Wait for DynamoDB Local to start (10 seconds)
sleep 10

# Run the Node.js script to create the table
node init_DB.mjs

# Wait for all background processes (if needed)
wait

