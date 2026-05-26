Design communication patterns for the LMS microservices. 

Context: 
${context} 

Tasks: 
1. Identify use cases requiring synchronous communication (REST/gRPC) 
2. Identify use cases requiring asynchronous communication (events, Kafka) 
3. Define event flows:    
    - CourseAssigned    
    - CourseCompleted    
    - AssessmentSubmitted 
4. Recommend:    
    - Message broker    
    - API strategy    
    - Error handling mechanisms Focus on: 
        - Resilience 
        - Scalability 
        - Loose coupling