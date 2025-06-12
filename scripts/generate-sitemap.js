import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK (use service account JSON in secrets or repo)
// For demo, this reads from env or local file, adapt as you want:
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function getPosts() {
  const postsRef = db.collection('posts');
  const snapshot = await postsRef.orderBy('createdAt', 'desc').get();

  const posts = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    posts.push({
      id: doc.id,
      url: `https://boostfollowerstips.netlify.app/post.html?id=${doc.id}`,
      lastmod: data.updatedAt ? data.updatedAt.toDate().toISOString() : data.createdAt.toDate().toISOString()
    });
  });
  return posts;
}

function getStaticPages() {
  // Add your static pages here
  return [
    { url: 'https://boostfollowerstips.netlify.app/index.html', lastmod: new Date().toISOString() },
    { url: 'https://boostfollowerstips.netlify.app/about.html', lastmod: new Date().toISOString() },
    { url: 'https://boostfollowerstips.netlify.app/contact.html', lastmod: new Date().toISOString() },
    { url: 'https://boostfollowerstips.netlify.app/terms.html', lastmod: new Date().toISOString() }
  ];
}

function generateXML(urls) {
  const header = `<?xml version="1.0" encoding="UTF-8"?>\n` +
                 `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  const footer = `</urlset>`;

  const body = urls.map(({ url, lastmod }) => `
    <url>
      <loc>${url}</loc>
      <lastmod>${lastmod}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>
  `).join('');

  return header + body + footer;
}

async function main() {
  const posts = await getPosts();
  const staticPages = getStaticPages();

  const allUrls = [...staticPages, ...posts];

  const sitemapXML = generateXML(allUrls);

  fs.writeFileSync('sitemap.xml', sitemapXML);

  console.log('sitemap.xml generated successfully');
}

main().catch(console.error);
