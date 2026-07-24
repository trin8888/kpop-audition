# K-POP Dream Team Audition Website

## 📁 File Structure
- `index.html` - Home page
- `about.html` - About Us page
- `apply.html` - Application form page
- `contact.html` - Contact information page
- `privacy.html` - Privacy policy page

## 🎨 Design Features
- **Color Scheme**: Black background (#000000) with dark blue accents (#001f3f) and bright blue highlights (#0074D9)
- **Bilingual Support**: Full English/Arabic toggle on every page
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Modern UI**: Clean, professional K-pop themed interface
- **Interactive Elements**: Language toggle, form validation, file upload preview

## 🌐 How to Make It Publicly Accessible

### Option 1: Google Forms Integration (Recommended for Form Data)
Since we can't directly save to Google Drive from client-side JavaScript for security reasons, here's the best approach:

#### Step 1: Create a Google Form
1. Go to [Google Forms](https://forms.google.com)
2. Create a new blank form
3. Add these fields (matching our form):
   - Full Name (Short answer, Required)
   - Stage Name (Short answer, Required)
   - Age (Number, Required, 12-30)
   - Country (Dropdown, Required)
   - Height (cm) (Number, Required, 120-220)
   - Social Media (Short answer, Required)
   - Positions (Checkboxes, Required: Vocal, Rap, Visual, Producer, Dance)
   - Audition Video (File upload, Required)

#### Step 2: Get the Form URL
1. Click the "Send" button in Google Forms
2. Choose the link icon (<>)
3. Copy the form URL (looks like: `https://docs.google.com/forms/d/e/FORM_ID/viewform`)

#### Step 3: Update the Form Action
In `apply.html`, find the form tag and change it to:
```html
<form class="application-form" id="auditionForm" action="YOUR_GOOGLE_FORM_URL" method="POST" target="_blank">
```

#### Step 4: Test the Integration
1. Submit a test application through your website
2. It should redirect to your Google Form
3. After submission, responses will automatically appear in Google Sheets (linked to the form)
4. Google Sheets is stored in your Google Drive!

### Option 2: Free Static Hosting (For the Website Itself)

#### GitHub Pages (Free)
1. Create a GitHub account at [github.com](https://github.com)
2. Create a new repository named `kpop-audition`
3. Upload all 5 HTML files to the repository
4. Go to Settings → Pages
5. Under "Source", select `main` branch and `/ (root)` folder
6. Click Save
7. Your site will be live at: `https://yourusername.github.io/kpop-audition/`

#### Netlify Drop (Instant & Free)
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag and drop your entire `kpop-audition` folder
3. Get an instant live URL like: `https:// charming-piroshki-12345.netlify.app/`

#### Vercel (Free for Static Sites)
1. Install Vercel CLI: `npm i -g vercel`
2. From your project folder: `vercel`
3. Follow the prompts
4. Get your live URL

### Option 3: Using Your Tablet as a Local Server
If you want to host this on your tablet without internet:

#### For Android Tablets:
1. Install "Servers Ultimate" or "KSWEB" from Google Play Store
2. Copy the `kpop-audition` folder to your tablet's storage
3. In the server app, set the document root to your `kpop-audition` folder
4. Start the server (usually on port 8080)
5. Access via: `http://localhost:8080` on the tablet
6. To access from other devices on same WiFi: find tablet's IP in WiFi settings, then use `http://[tablet-ip]:8080`

#### For iPad:
1. Install "HTTP Server" or "FileBrowser Pro" from App Store
2. Follow similar steps as above

## 📱 Using on Your Tablet

### Method A: Direct File Access (Simplest)
1. Connect tablet to PC via USB
2. Copy the entire `kpop-audition` folder to your tablet
3. Use any file manager app to navigate to the folder
4. Tap on `index.html` to open it in your browser
5. Everything works offline!

### Method B: Local Server on Tablet
Follow the instructions above in "Option 3: Using Your Tablet as a Local Server"

## 🔧 Technical Notes

### Form Functionality
- All form validation happens client-side (no page refresh needed)
- File upload shows selected filename
- Submit button shows thank you alert in both languages
- Form resets after successful submission

### Language Toggle
- Available on every page in the top-right corner
- Switches all text between English and Arabic instantly
- Maintains state as you navigate between pages
- Proper RTL/LTR handling for Arabic text

### Design Elements
- Modern card-based layout with subtle shadows
- Hover effects on all interactive elements
- Smooth transitions and animations
- Mobile-optimized touch targets (minimum 44px)
- Accessible color contrast ratios

## 🚀 Next Steps

1. **Test Locally**: Open `index.html` in any browser to verify everything works
2. **Set Up Google Forms**: Follow the instructions above to connect form submissions to Google Sheets/Drive
3. **Deploy**: Choose one of the hosting options to make it publicly accessible
4. **Share**: Distribute the link to aspiring K-pop artists!
5. **Monitor**: Check your Google Form responses regularly for new applications

## 💡 Pro Tips

- **Google Forms Backup**: All responses automatically save to a Google Sheet in your Drive
- **Email Notifications**: In Google Forms, go to Responses → ⋮ → Get email notifications for new responses
- **File Organization**: Uploaded videos will be stored in a folder in your Google Drive
- **Custom Domain**: Later, you can connect a custom domain (like `kpopdreamteam.com`) to your hosting service
- **Analytics**: Add Google Analytics to track visitor demographics and behavior

## ❓ Troubleshooting

- **Form not submitting**: Check that all required fields are filled
- **File upload not showing**: Make sure you selected a file (look for the filename below the upload area)
- **Language toggle not working**: Ensure JavaScript is enabled in your browser
- **Styles not loading**: Make sure all files are in the same folder and file names are correct

## 🎉 Ready to Use!
Your bilingual K-pop audition website is complete and ready to discover the next generation of K-pop stars! The design combines professional K-pop aesthetics with practical functionality for global applicants.

**Remember**: For actual video submissions to be stored in Google Drive, you'll need to set up the Google Forms integration as described above.