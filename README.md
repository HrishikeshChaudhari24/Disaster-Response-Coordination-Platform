🌪️ Disaster Response Coordination Platform 🚨
A real-time, AI-powered disaster management system built with the MERN stack, designed to streamline disaster response through alerts, citizen reports, and resource tracking.

🚁 Features

Disaster AlertsReal-time notifications with precise location data and disaster type tags (e.g., "Flood", "Earthquake").

Verified Citizen ReportsCitizens can submit photos, descriptions, and urgent needs. Reports are verified using AI and human review.

Relief Resources MapInteractive map displaying active shelters, food centers, and medical aid, updated with geospatial queries.

Social Media Intelligence (Mocked)Scans Twitter-like feeds for real-time emergency signals.

AI-Powered Location ExtractionLeverages Google Vertex AI + Gemini to extract precise geo-locations from unstructured emergency text.

Admin DashboardCentralized interface for managing disasters, verifying reports, and coordinating resources.



🤖 How AI is Used in the Project
🔍 1. Location Extraction from TextEmergency reports or social media posts often contain vague or messy location information (e.g., "near Andheri station"). Using Google Vertex AI with Gemini, we apply NLP techniques to extract clean, geocodable location names like "Andheri East, Mumbai". This enables us to:  

Accurately geopoint the crisis area on a map.  
Automatically match reports to existing disaster zones.

🧠 2. Verification Pipeline (Future-ready)Our verification endpoint is designed to integrate with an AI image verification model to identify fake or disinformation images in disaster posts. This will help filter:  

Old viral images reused in new crises.  
Deepfakes or edited visuals.


🛠️ Tech Stack



Technology
Purpose



MongoDB
Stores disasters, reports, and resources


Express.js
Powers RESTful backend APIs


React.js
Builds intuitive frontend dashboard


Node.js
Runs the backend


Supabase
Manages real-time geospatial data and storage


Google Vertex AI + Gemini
Extracts locations via NLP


Mapbox
Renders interactive disaster/resource maps


Netlify + Render
Hosts frontend and backend


Multer
Handles secure image uploads



🌍 Live Demo

Frontend: [disaster-response-coordination.netlify.app ](https://disaster-response-coordination.netlify.app/) 
Backend API: Hosted on Render, auto-verifies reports, processes data, and extracts location info.
Project URL: [disaster-response-coordination.netlify.app](https://disaster-response-coordination.netlify.app/)


🧪 Sample Data
Inspired by real-world events, here's how the data is structured:
{
  "Disaster": {
    "title": "NYC Flood",
    "location_name": "Manhattan, NYC",
    "description": "Heavy flooding in Manhattan",
    "tags": ["flood", "urgent"],
    "owner_id": "netrunnerX"
  },
  "Report": {
    "disaster_id": "123",
    "user_id": "citizen1",
    "content": "Need food in Lower East Side",
    "image_url": "http://example.com/flood.jpg",
    "verification_status": "pending"
  },
  "Resource": {
    "disaster_id": "123",
    "name": "Red Cross Shelter",
    "location_name": "Lower East Side, NYC",
    "type": "shelter"
  }
}


❤️ Author
Made with love and caffeine by Hrishikesh Chaudhari  
🔗 GitHub: github.com/hrishikeshchaudhari💼 LinkedIn: linkedin.com/in/hrishikesh-chaudhari
