# Logo Assets

## 📁 Folder Structure

This folder contains all logo images for the UW Lost & Found application.

## 🎓 UWaterloo Logo

**Filename:** `uw-logo.svg` or `uw-logo.png`

**Where to get it:**
- Download from: https://uwaterloo.ca/brand/templates-and-resources
- Or use the official: https://uwaterloo.ca/brand/sites/default/files/uploads/images/uw-logo-main.svg

**Recommended specs:**
- Format: SVG (vector) or PNG (high-res)
- Size: At least 200px width for PNG
- Background: Transparent
- Color: Black (will be inverted to white in CSS)

## 📂 Usage in Code

```jsx
// In Navigation.jsx
<img 
  src="/assets/images/logos/uw-logo.svg" 
  alt="University of Waterloo" 
  className="nav-brand-logo"
/>
```

## 🖼️ Other Logos/Images

You can add:
- `favicon.ico` - Browser tab icon
- `uw-logo-gold.svg` - Gold variant if needed
- `uw-logo-white.svg` - White variant

## 📝 Notes

- All files in `/public` are served at the root URL
- Reference them with `/assets/images/logos/filename.ext`
- SVG files are preferred (scalable, small file size)
- PNG files should be high-resolution (2x or 3x)


