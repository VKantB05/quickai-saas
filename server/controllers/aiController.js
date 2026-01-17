import dotenv from "dotenv";
dotenv.config();
import { clerkClient } from "@clerk/express";
import sql from "../config/db.js";
import OpenAI from "openai";
import { v2 as cloudinary } from 'cloudinary';
import axios from "axios";
import FormData from "form-data";
import fs from "fs";




const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});


export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== 'premium' && free_usage >= 10) {
      return res.json({ success: false, message: "limit exceeded. Please upgrade to premium plan." });
    }

    const response = await AI.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: prompt, }],
      temperature: 0.9,
      max_tokens: length,
    });

    const content = response.choices[0].message.content;

    await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'article')`;

    if (plan !== 'premium') {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1
        }
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.log(error.message)
    res.json({ success: false, message: error.message });
  }
}


export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== 'premium' && free_usage >= 10) {
      return res.json({ success: false, message: "limit exceeded. Please upgrade to premium plan." });
    }

    const response = await AI.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: prompt, }],
      temperature: 0.9,
      max_tokens: 2048,
    });

    const content = response.choices[0].message.content;

    await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'blog-article')`;

    if (plan !== 'premium') {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1
        }
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.log(error.message)
    res.json({ success: false, message: error.message });
  }
}

export const generateImage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, publish } = req.body;
    const plan = req.plan;

    if (plan !== 'premium') {
      return res.json({ success: false, message: "This feature is available in premium plan." });
    }

    const formData = new FormData()
    formData.append('prompt', prompt)
    const { data } = await axios.post('https://clipdrop-api.co/text-to-image/v1', formData, {
      headers: { 'x-api-key': process.env.CLIPDROP_API_KEY },
      responseType: 'arraybuffer'
    })

    const base64Image = `data:image/png;base64,${Buffer.from(data, 'binary').toString('base64')}`;

    const { secure_url } = await cloudinary.uploader.upload(base64Image)

    await sql`INSERT INTO creations (user_id, prompt, content, type,publish) VALUES (${userId}, ${prompt}, ${secure_url}, 'image',${publish ?? false})`;

    res.json({ success: true, content: secure_url });
  } catch (error) {
    console.log(error.message)
    res.json({ success: false, message: error.message });
  }
}

export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = req.auth();
    const image = req.file;
    const plan = req.plan;

    if (plan !== 'premium') {
      return res.json({ success: false, message: "This feature is available in premium plan." });
    }

    if (!image) {
       return res.json({ success: false, message: "No image file provided." });
    }

    

    const { secure_url } = await cloudinary.uploader.upload(image.path, {
      transformation: [
        {
          effect: 'background_removal',
          background_removal: 'remove_the_background'
        }
      ]
    })

    await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${'Remove background from image '}, ${secure_url}, 'image')`;

    res.json({ success: true, content: secure_url });

  } catch (error) {
    console.log(error.message)
    res.json({ success: false, message: error.message });
  }
}

export const removeImageObject = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { object } = req.body;
    const image = req.file;
    const plan = req.plan;

    if (plan !== 'premium') {
      return res.json({ success: false, message: "This feature is available in premium plan." });
    }


    const { public_id } = await cloudinary.uploader.upload(image.path)

    const image_url = cloudinary.url(public_id, {
      transformation: [{ effect: `gen_remove:${object}` }],
      responseType: 'image'
    })

    await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${`Remove ${object} from image `}, ${image_url}, 'image')`;

    res.json({ success: true, content: image_url });

  } catch (error) {
    console.log(error.message)
    res.json({ success: false, message: error.message });
  }
}


// export const resumeReview = async (req, res) => {
//   try {
//     const { userId } = req.auth();
//     const resume = req.file;
//     const plan = req.plan;

//     if (plan !== 'premium') {
//       return res.json({ success: false, message: "This feature is available in premium plan." });
//     }


//     if (resume.size > 5 * 1024 * 1024) {
//       return res.json({ success: false, message: "File size exceeds 5MB limit." });
//     }

//     const databuffer = fs.readFileSync(resume.path);
//     const pdfData = await pdf(databuffer);

//     const prompt = `review the following resume and provide constructive feedback on its strengths,weakness, and areas for improvement.Resume Content:\n\n${pdfData.text}`;


//     const response = await AI.chat.completions.create({
//       model: "gemini-2.5-flash",
//       messages: [{ role: "user", content: prompt, }],
//       temperature: 0.7,
//       max_tokens: 1000,
//     });

//     const content = response.choices[0].message.content;

//     await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, 'review the uploaded resume', ${content}, 'resume-review')`;

//     res.json({ success: true, content });

//   } catch (error) {
//     console.log(error.message)
//     res.json({ success: false, message: error.message });
//   }
// }

export const resumeReview = async (req, res) => {
  try {
    const { userId } = req.auth();
    const resume = req.file; // Assumes Multer memoryStorage
    const plan = req.plan;

    if (plan !== 'premium') {
      return res.json({ success: false, message: "Premium plan required." });
    }

    if (!resume) {
      return res.json({ success: false, message: "No file uploaded." });
    }

    // 1. Read the file from the disk path and convert to Base64
    const fileBuffer = fs.readFileSync(resume.path);
    const base64Data = fileBuffer.toString("base64");

    const prompt = `
You are an expert Technical Recruiter and Career Coach with 15+ years of experience in talent acquisition for Fortune 500 companies. 

Analyze the provided resume with high precision and provide a deep-dive report structured exactly into these categories:

1. **Overall Professional Impression**: Give a 2-sentence executive summary of the profile's marketability.
2. **ATS Optimization Score (0-100)**: Estimate how well this resume would pass through an Applicant Tracking System. List missing keywords common in the current industry.
3. **Top Strengths**: Identify the 3 most "hireable" aspects of the resume.
4. **Critical Weaknesses**: Pinpoint specific gaps (e.g., lack of metrics, poor formatting, or missing tech stacks).
5. **Project-Specific Advice**: Look at the projects. Are they "tutorial-level" or "production-level"? Suggest how to make them sound more impactful using the 'Star Method' (Situation, Task, Action, Result).
6. **Industry-Level Recommendations (2026 Standards)**: What specific tools, certifications, or soft skills are currently trending in this candidate's field that they are missing?
7. **Actionable Checklist**: Provide a bulleted list of "Change X to Y" for immediate improvement.

Tone: Professional, brutally honest but constructive, and high-energy.
`;

    // 2. Use the SAME AI instance and model you use elsewhere
    const response = await AI.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url", // Gemini's OpenAI bridge uses this for PDFs/Images
              image_url: {
                url: `data:application/pdf;base64,${base64Data}`,
              },
            },
          ],
        },
      ],
      temperature: 0.5,
    });

    const content = response.choices[0].message.content;

    // 3. Save to your database
    await sql`INSERT INTO creations (user_id, prompt, content, type) 
              VALUES (${userId}, 'Resume Review', ${content}, 'resume-review')`;

    res.json({ success: true, content });

  } catch (error) {
    console.error("Analysis Error:", error);
    res.json({ success: false, message: "AI could not process the file. Ensure it is a valid PDF." });
  }
};



