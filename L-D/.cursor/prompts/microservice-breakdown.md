Break down the LMS system into microservices. 

Input: 
${context} 

Tasks: 
1. Identify bounded contexts 
2. Define each microservice responsibility 
3. Specify:    
    - APIs exposed    
    - Database ownership    
    - Dependencies Also define: 
        - Which services are synchronous 
        - Which are event-driven Avoid tight coupling and shared DBs.