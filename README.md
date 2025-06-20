<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Disaster Response Coordination Platform</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        h1, h2, h3 {
            color: #333;
        }
        h1 {
            font-size: 2.5em;
        }
        h2 {
            font-size: 1.8em;
            border-bottom: 2px solid #007bff;
            padding-bottom: 5px;
        }
        h3 {
            font-size: 1.4em;
        }
        ul {
            list-style-type: none;
            padding: 0;
        }
        ul li {
            margin: 10px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        table, th, td {
            border: 1px solid #ddd;
        }
        th, td {
            padding: 10px;
            text-align: left;
        }
        th {
            background-color: #007bff;
            color: #fff;
        }
        pre {
            background: #f8f8f8;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        a {
            color: #007bff;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        .emoji {
            font-size: 1.2em;
            margin-right: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1><span class="emoji">🌪️</span> Disaster Response Coordination Platform <span class="emoji">🚨</span></h1>
        <p>A real-time, AI-powered disaster management system built with the MERN stack, designed to streamline disaster response through alerts, citizen reports, and resource tracking.</p>

        <h2><span class="emoji">🚁</span> Features</h2>
        <ul>
            <li><strong>Disaster Alerts:</strong> Real-time notifications with precise location data and disaster type tags (e.g., "Flood", "Earthquake").</li>
            <li><strong>Verified Citizen Reports:</strong> Citizens can submit photos, descriptions, and urgent needs. Reports are verified using AI and human review.</li>
            <li><strong>Relief Resources Map:</strong> Interactive map displaying active shelters, food centers, and medical aid, updated with geospatial queries.</li>
            <li><strong>Social Media Intelligence (Mocked):</strong> Scans Twitter-like feeds for real-time emergency signals.</li>
            <li><strong>AI-Powered Location Extraction:</strong> Leverages Google Vertex AI + Gemini to extract precise geo-locations from unstructured emergency text.</li>
            <li><strong>Admin Dashboard:</strong> Centralized interface for managing disasters, verifying reports, and coordinating resources.</li>
        </ul>

        <h2><span class="emoji">🤖</span> How AI is Used in the Project</h2>
        <h3><span class="emoji">🔍</span> 1. Location Extraction from Text</h3>
        <p>Emergency reports or social media posts often contain vague or messy location information (e.g., "near Andheri station"). Using Google Vertex AI with Gemini, we apply NLP techniques to extract clean, geocodable location names like "Andheri East, Mumbai". This enables us to:</p>
        <ul>
            <li>Accurately geopoint the crisis area on a map.</li>
            <li>Automatically match reports to existing disaster zones.</li>
        </ul>
        <h3><span class="emoji">🧠</span> 2. Verification Pipeline (Future-ready)</h3>
        <p>Our verification endpoint is designed to integrate with an AI image verification model to identify fake or disinformation images in disaster posts. This will help filter:</p>
        <ul>
            <li>Old viral images reused in new crises.</li>
            <li>Deepfakes or edited visuals.</li>
        </ul>

        <h2><span class="emoji">🛠️</span> Tech Stack</h2>
        <table>
            <tr>
                <th>Technology</th>
                <th>Purpose</th>
            </tr>
            <tr>
                <td>MongoDB</td>
                <td>Stores disasters, reports, and resources</td>
            </tr>
            <tr>
                <td>Express.js</td>
                <td>Powers RESTful backend APIs</td>
            </tr>
            <tr>
                <td>React.js</td>
                <td>Builds intuitive frontend dashboard</td>
            </tr>
            <tr>
                <td>Node.js</td>
                <td>Runs the backend</td>
            </tr>
            <tr>
                <td>Supabase</td>
                <td>Manages real-time geospatial data and storage</td>
            </tr>
            <tr>
                <td>Google Vertex AI + Gemini</td>
                <td>Extracts locations via NLP</td>
            </tr>
            <tr>
                <td>Mapbox</td>
                <td>Renders interactive disaster/resource maps</td>
            </tr>
            <tr>
                <td>Netlify + Render</td>
                <td>Hosts frontend and backend</td>
            </tr>
            <tr>
                <td>Multer</td>
                <td>Handles secure image uploads</td>
            </tr>
        </table>

        <h2><span class="emoji">🌍</span> Live Demo</h2>
        <ul>
            <li><strong>Frontend:</strong> <a href="https://disaster-response-coordination.netlify.app">disaster-response-coordination.netlify.app</a></li>
            <li><strong>Backend API:</strong> Hosted on Render, auto-verifies reports, processes data, and extracts location info.</li>
            <li><strong>Project URL:</strong> <a href="https://disaster-response-coordination.netlify.app">disaster-response-coordination.netlify.app</a></li>
        </ul>

        <h2><span class="emoji">🧪</span> Sample Data</h2>
        <p>Inspired by real-world events, here's how the data is structured:</p>
        <pre>
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
        </pre>

        <h2><span class="emoji">❤️</span> Author</h2>
        <p>Made with love and caffeine by <strong>Hrishikesh Chaudhari</strong></p>
        <ul>
            <li><span class="emoji">🔗</span> <strong>GitHub:</strong> <a href="https://github.com/hrishikeshchaudhari">github.com/hrishikeshchaudhari</a></li>
            <li><span class="emoji">💼</span> <strong>LinkedIn:</strong> <a href="https://linkedin.com/in/hrishikesh-chaudhari">linkedin.com/in/hrishikesh-chaudhari</a></li>
        </ul>
    </div>
</body>
</html>
