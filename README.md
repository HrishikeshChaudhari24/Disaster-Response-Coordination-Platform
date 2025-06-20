# 🌪️ Disaster Response Coordination Platform 🚨

A real-time, AI-powered disaster management system built with the MERN stack, designed to streamline disaster response through alerts, citizen reports, and resource tracking.

---

## 🚁 Features

- **Disaster Alerts**  
  Real-time notifications with precise location data and disaster type tags (e.g., "Flood", "Earthquake").

- **Verified Citizen Reports**  
  Citizens can submit photos, descriptions, and urgent needs. Reports are verified using AI and human review.

- **Relief Resources Map**  
  Interactive map displaying active shelters, food centers, and medical aid, updated with geospatial queries.

- **Social Media Intelligence (Mocked)**  
  Scans Twitter-like feeds for real-time emergency signals.

- **AI-Powered Location Extraction**  
  Leverages Google Vertex AI + Gemini to extract precise geo-locations from unstructured emergency text.

- **Admin Dashboard**  
  Centralized interface for managing disasters, verifying reports, and coordinating resources.

---

## 🤖 How AI is Used in the Project

### 🔍 1. Location Extraction from Text  
Emergency reports or social media posts often contain vague or messy location info like:

> _"near Andheri station"_

Using **Google Vertex AI with Gemini**, the system applies **NLP** to extract clean, geocodable names like _"Andheri East, Mumbai"_.

This helps us:
- Pinpoint the crisis area on a map
- Auto-link reports to existing disasters

---

### 🧠 2. Verification Pipeline (Future-ready)  
Our report verification endpoint is designed for integration with an **AI image verification model**, capable of:

- Detecting reused viral images
- Filtering out deepfakes or manipulated visuals

---

## 🛠️ Tech Stack

| Technology               | Purpose                                      |
|--------------------------|----------------------------------------------|
| MongoDB                  | Stores disasters, reports, and resources     |
| Express.js               | RESTful backend APIs                         |
| React.js                 | Frontend dashboard                          |
| Node.js                  | Backend runtime                             |
| Supabase                 | Real-time geospatial queries & storage      |
| Google Vertex AI + Gemini | NLP-based location extraction              |
| Mapbox                   | Disaster/resource mapping                   |
| Netlify + Render         | Deployment                                  |
| Multer                   | Secure image uploads                        |

---

## 🌍 Live Demo

- **Frontend**: [https://disaster-response-coordination.netlify.app](https://disaster-response-coordination.netlify.app)
- **Backend API**: Hosted on Render
- **Full Project**: [Click Here](https://disaster-response-coordination.netlify.app)

---

## 🧪 Sample Data

```json
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
```

---

## ❤️ Author

Made with love and caffeine by Hrishikesh Chaudhari ☕

🔗 GitHub: [Github](https://github.com/HrishikeshChaudhari24/)

💼 LinkedIn: [Linkedin](https://www.linkedin.com/in/hrishikesh-chaudhari-169308248/)
📧 Email: [Email](mailto:chaudharihrishikesh30@gmail.com)
