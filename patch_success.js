const fs = require('fs');
const file = 'D:/Live/website/maazoud/app/order-success/page.js';
// Actually the path is D:/Live/oudwebsite/maazoud/app/order-success/page.js
const actualFile = 'D:/Live/oudwebsite/maazoud/app/order-success/page.js';

let content = fs.readFileSync(actualFile, 'utf8');

const targetStr = `  const orderId = searchParams.get("orderId") || "ORD-XXXXXX";`;
const replacementStr = `  const orderId = searchParams.get("orderId");

  useEffect(() => {
    // Agar URL me koi valid orderId nahi hai (matlab direct access ki koshish ki gayi hai), 
    // toh user ko wapas home page par bhej do
    if (!orderId) {
      router.push('/');
    }
  }, [orderId, router]);

  if (!orderId) return null; // Jab tak redirect ho, tab tak kuch mat dikhao
`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  
  // Also we need to make sure useEffect is imported
  if (!content.includes('useEffect')) {
    content = content.replace('import React, { Suspense } from "react";', 'import React, { Suspense, useEffect } from "react";');
  }

  fs.writeFileSync(actualFile, content, 'utf8');
  console.log("Order success page secured");
} else {
  console.log("Could not find target string");
}
