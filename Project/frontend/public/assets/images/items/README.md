# Item Images

## 📁 Folder Structure

This folder is for images of lost items uploaded by staff.

## 🖼️ Image Guidelines

**Supported formats:**
- JPG/JPEG
- PNG
- WebP

**Recommended specs:**
- Max size: 5MB per file
- Recommended resolution: 800x600px or 1200x900px
- Aspect ratio: 4:3 or 16:9

## 📝 Usage

Staff can upload item images when creating new lost items in the dashboard.

Images are stored as:
- Base64 strings in database (current implementation)
- Or as files in this folder (future implementation)

## 🔒 Privacy

- Remove any sensitive information from images
- Blur faces if people are visible
- Don't include personal information


