ELITE GOPAL – বাংলা ভিডিও ওয়েবসাইট

লোকাল ডেমো চালানো:
1. ZIP extract করুন।
2. VS Code-এ ফোল্ডারটি খুলুন।
3. Live Server extension দিয়ে index.html চালু করুন।
   অথবা Python থাকলে ফোল্ডারের ভেতর: python -m http.server 8000
   তারপর ব্রাউজারে http://localhost:8000 খুলুন।

Supabase যুক্ত করা:
1. Supabase project তৈরি করুন।
2. SQL Editor-এ schema.sql ফাইলের SQL চালান।
3. js/supabase.js ফাইলে YOUR_SUPABASE_URL এবং YOUR_SUPABASE_ANON_KEY বসান।
4. Supabase Authentication থেকে admin user তৈরি করুন।
5. ওই user-এর UID নিয়ে SQL চালান:
   insert into admins(user_id) values('YOUR-ADMIN-USER-UUID');
6. Storage bucket videos ও thumbnails তৈরি/নীতিমালা schema.sql অনুযায়ী যাচাই করুন।
7. login.html থেকে অ্যাডমিন লগইন করুন।

গুরুত্বপূর্ণ:
- Supabase যুক্ত না করা পর্যন্ত সাইটে নমুনা ভিডিও দেখা যাবে; আপলোড/অ্যাডমিন লগইন কাজ করবে না।
- ডেমো ভিডিওগুলো কেবল পরীক্ষার জন্য।
- ডাউনলোডের গন্তব্য ডিভাইস/ব্রাউজারের নিয়ম অনুযায়ী নির্ধারিত হয়; সরাসরি Gallery-তে সেভ নিশ্চিত নয়।
- ভিডিও প্রকাশ/ডাউনলোডের আগে কনটেন্ট ব্যবহারের অনুমতি নিশ্চিত করুন।
