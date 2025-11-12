# Product Requirements Document
## Food 101 Image Classification App

## Executive Summary

### Problem Statement
Business users and data scientists need a simple, polished web interface to demonstrate the capabilities of the Food 101 conformal prediction model. Current solutions either require technical knowledge to use model serving endpoints directly or lack the polish needed for professional demos.

### Solution
A clean, modern Databricks web application that allows users to upload food images and receive instant classification results with confidence scores and prediction sets from a conformal prediction model. The interface is inspired by simple Gradio apps but with a more polished, professional aesthetic using modern UI components.

### Success Criteria
- Users can classify food images in under 10 seconds from upload to results
- Interface is intuitive enough that demo attendees can use it without instruction
- Results clearly communicate both the top prediction and the uncertainty quantification (prediction set)
- Application is reliable and performs well during live demos

---

## Target Users

### Primary Users: Business Stakeholders & Data Scientists
**Use Cases:**
- **Sales Demos**: Showcasing ML capabilities to potential customers
- **Stakeholder Presentations**: Demonstrating model performance to executives
- **Model Validation**: Quick visual verification of model behavior on specific images
- **Team Demos**: Showing the team how the conformal prediction model works

**User Characteristics:**
- Not necessarily technical, need simple interface
- Value clean, professional presentation
- Need quick, reliable results during live presentations
- Want to understand both the prediction and the model's confidence

**User Needs:**
- Zero setup time - just upload and go
- Clear, easy-to-understand results
- Professional appearance suitable for presentations
- No authentication barriers (open access for demos)

---

## Core Features

### Feature 1: Image Upload
**Description:** Users can upload food images using drag-and-drop or file picker

**Requirements:**
- Support common image formats: JPG, JPEG, PNG
- Drag-and-drop upload area with visual feedback
- Traditional file picker button as alternative
- Reasonable file size limit (e.g., 10MB max)
- Clear visual feedback during upload
- Image preview after upload

**User Story:**
As a demo presenter, I want to easily upload food images so that I can quickly show classification results to my audience.

### Feature 2: Image Preview
**Description:** Display the uploaded image before and during classification

**Requirements:**
- Show preview of uploaded image
- Appropriate sizing (not too large, maintains aspect ratio)
- Clear, high-quality display
- Remains visible alongside results

**User Story:**
As a user, I want to see the image I uploaded so that I can verify it's the correct image and see what the model is analyzing.

### Feature 3: Model Classification
**Description:** Send image to Databricks model serving endpoint and retrieve results

**Requirements:**
- Connect to "food101-cv-conformal-endpoint" model serving endpoint
- Convert uploaded image to binary format (image_bytes)
- Handle model serving authentication
- Display loading state during classification
- Handle errors gracefully with user-friendly messages

**Technical Details:**
- **Endpoint:** food101-cv-conformal-endpoint
- **Input:** image_bytes (binary)
- **Output:**
  - prediction_set (array of strings) - possible labels
  - prediction_scores (array of doubles) - confidence scores
  - set_size (long) - number of predictions in set
  - top_prediction (string) - most likely class
  - top_score (double) - confidence of top prediction

**User Story:**
As a data scientist, I want the app to call my model serving endpoint so that I can demonstrate the deployed model's capabilities.

### Feature 4: Top Prediction Display
**Description:** Prominently display the most likely food class with confidence score

**Requirements:**
- Large, clear display of top prediction label
- Confidence score shown as percentage
- Visually distinct from prediction set (larger, more prominent)
- Color-coded based on confidence level

**User Story:**
As a presenter, I want the top prediction to be immediately obvious so that my audience can quickly see what the model thinks the food is.

### Feature 5: Prediction Set Display
**Description:** Show all possible predictions from conformal classifier with confidence bars

**Requirements:**
- Display all items in prediction set (maximum 6 items)
- List format with food class name and confidence score
- Visual confidence bars (horizontal bars showing probability)
- Color-coded confidence levels:
  - High confidence (>70%): Green
  - Medium confidence (40-70%): Yellow/Amber
  - Low confidence (<40%): Red/Orange
- Sorted by confidence score (descending)
- Clear labeling of percentages

**User Story:**
As a data scientist, I want to show the prediction set from the conformal classifier so that stakeholders understand the model's uncertainty quantification.

### Feature 6: Simple, Clean Interface
**Description:** Professional, modern UI using shadcn/ui components

**Requirements:**
- Clean, uncluttered layout
- Modern component design (shadcn/ui)
- Responsive design (works on different screen sizes)
- Consistent color scheme and typography
- Minimal distractions - focus on upload and results
- Professional appearance suitable for demos

**User Story:**
As a presenter, I want a polished, professional interface so that my demos look credible and impressive to stakeholders.

---

## Non-Functional Requirements

### Performance
- Image classification completes within 5 seconds under normal conditions
- Application loads in under 2 seconds
- Smooth, responsive UI interactions

### Reliability
- 99% uptime during business hours
- Graceful error handling with user-friendly messages
- No data loss during upload process

### Security
- No authentication required (open access)
- No storage of uploaded images (privacy-friendly)
- Secure communication with model serving endpoint

### Usability
- Zero learning curve - intuitive for first-time users
- Works without instruction manual
- Clear visual feedback for all actions

---

## Out of Scope (Not Included)

### Explicitly NOT Included:
- User authentication/login
- Upload history or saved predictions
- Multiple image uploads at once
- Batch processing
- Export/download of results
- Image editing or preprocessing tools
- Model performance metrics or analytics dashboard
- User accounts or personalization
- Mobile app (web only)

---

## User Workflows

### Primary Workflow: Classify Food Image

1. **User arrives at app**
   - Sees clean landing page with upload area
   - No login required

2. **User uploads image**
   - Drags image file onto upload area OR
   - Clicks upload button and selects file
   - Sees image preview appear

3. **User initiates classification**
   - Clicks "Classify" button
   - Sees loading indicator

4. **User views results**
   - Top prediction appears prominently
   - Prediction set displays below with confidence bars
   - Can see uploaded image alongside results

5. **User uploads another image (optional)**
   - Can upload new image to replace current one
   - Process repeats

---

## Success Metrics

### Primary Metrics:
- **Time to Result:** Average time from upload to classification result < 5 seconds
- **Demo Success Rate:** 95%+ of demos complete without technical issues
- **User Satisfaction:** Positive feedback from demo attendees

### Secondary Metrics:
- **App Availability:** 99%+ uptime during business hours
- **Error Rate:** < 1% of classification attempts result in errors
- **First-Time User Success:** 100% of users can successfully classify an image without assistance

---

## Implementation Priority

### Phase 1: MVP (Must Have)
1. Basic image upload (file picker)
2. Image preview
3. Model serving endpoint integration
4. Top prediction display
5. Basic prediction set list
6. Simple, clean layout

### Phase 2: Enhanced Experience (Should Have)
1. Drag-and-drop upload
2. Confidence bars for prediction set
3. Color-coded confidence levels
4. Loading states and animations
5. Error handling and user feedback
6. Polished UI with shadcn/ui components

### Phase 3: Polish (Nice to Have)
1. Responsive design optimizations
2. Performance optimizations
3. Enhanced visual design
4. Improved error messages
5. Additional image format support

---

## Technical Constraints

### Must Use:
- Databricks Apps platform
- Model serving endpoint: "food101-cv-conformal-endpoint"
- FastAPI backend (existing template)
- React frontend (existing template)
- shadcn/ui components

### Image Format Support:
- JPG/JPEG
- PNG
- Reasonable file size limit (10MB recommended)

### Model Interface:
- **Input:** Binary image data (image_bytes)
- **Output Schema:**
  - prediction_set: Array of strings
  - prediction_scores: Array of doubles
  - set_size: Long integer
  - top_prediction: String
  - top_score: Double

---

## Design Principles

1. **Simplicity First:** Every feature must justify its existence. When in doubt, leave it out.
2. **Demo-Ready:** Interface should look professional and polished at all times.
3. **Clarity Over Cleverness:** Results should be immediately understandable.
4. **Fast Feedback:** Users should always know what's happening (loading states, clear errors).
5. **Zero Learning Curve:** If users need instructions, we've failed.

---

## Questions & Assumptions

### Assumptions:
- Users have modern web browsers (Chrome, Firefox, Safari, Edge)
- Model serving endpoint is already deployed and accessible
- Model returns results in under 5 seconds
- Maximum prediction set size is 6 items
- Users will primarily use desktop/laptop browsers (not mobile)

### Open Questions:
- None at this time

---

## Appendix: Model Signature Reference

```
MLmodel signature:
  inputs: '[{"type": "binary", "name": "image_bytes", "required": true}]'
  outputs: '[{"type": "array", "items": {"type": "string"}, "name": "prediction_set",
    "required": true}, {"type": "array", "items": {"type": "double"}, "name": "prediction_scores",
    "required": true}, {"type": "long", "name": "set_size", "required": true}, {"type":
    "string", "name": "top_prediction", "required": true}, {"type": "double", "name":
    "top_score", "required": true}]'
  params: null
```

### Example Response:
```json
{
  "prediction_set": ["pizza", "flatbread", "bruschetta", "focaccia"],
  "prediction_scores": [0.85, 0.72, 0.68, 0.62],
  "set_size": 4,
  "top_prediction": "pizza",
  "top_score": 0.85
}
```
