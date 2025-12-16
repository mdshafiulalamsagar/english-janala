// --- Registration Logic ---
const regBtn = document.getElementById('reg-btn');
if (regBtn) {
    regBtn.addEventListener('click', async () => {
        // নাম এর বদলে ইমেইল নিচ্ছি
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-pass').value;

        if (!email || !password) {
            alert("Please fill all fields!");
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }) // name এর বদলে email পাঠাচ্ছি
            });

            const data = await response.json();

            if (response.ok) {
                alert("Registration Successful! 🎉 Please Login now.");
                document.getElementById('reg-email').value = "";
                document.getElementById('reg-pass').value = "";
            } else {
                alert("Error: " + data.detail);
            }
        } catch (error) {
            console.error('Error:', error);
            alert("Server Error. Check console.");
        }
    });
}

// --- Login Logic ---
const loginBtn = document.getElementById('login-btn');
if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-pass').value;

        if (!email || !password) {
            alert("Email and Password required!");
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // ইমেইল সেভ করছি লোকাল স্টোরেজে
                localStorage.setItem("user_email", data.email);
                alert("Login Successful!");
                window.location.href = "index.html"; 
            } else {
                alert("Login Failed: " + (data.detail || "Invalid credentials"));
            }
        } catch (error) {
            console.error('Error:', error);
            alert("Server connection failed.");
        }
    });
}

// --- Navbar & Hero Button Logic ---
const checkLoginStatus = () => {
    // এখন আমরা user_email চেক করব
    const userEmail = localStorage.getItem("user_email");
    const navUserArea = document.getElementById('nav-user-area');
    const heroBtn = document.getElementById('hero-btn');

    if (userEmail) {
        // ১. উপরের মেনুতে ইমেইল দেখানো
        if (navUserArea) {
            // ইমেইল অনেক বড় হতে পারে, তাই @ এর আগেরটুকু দেখাতে পারি বা পুরোটা
            // সুন্দর দেখানোর জন্য শুধু @ এর আগের অংশ নিচ্ছি (যেমন: sagar123)
            const displayName = userEmail.split('@')[0]; 
            
            navUserArea.innerHTML = `
                <div class="dropdown dropdown-end">
                    <div tabindex="0" role="button" class="btn btn-ghost text-base font-normal">
                        <i class="fa-solid fa-user"></i> ${displayName}
                    </div>
                    <ul tabindex="0" class="menu dropdown-content bg-base-100 rounded-box z-1 mt-4 w-52 p-2 shadow">
                        <li class="px-4 py-2 text-xs text-gray-400 border-b">${userEmail}</li>
                        <li><a onclick="logoutUser()" class="text-error"><i class="fa-solid fa-arrow-right-from-bracket"></i> Logout</a></li>
                    </ul>
                </div>
            `;
        }

        // ২. হিরো বাটন আপডেট
        if (heroBtn) {
            heroBtn.innerHTML = 'Start Learning <i class="fa-solid fa-book-open ml-2"></i>';
            heroBtn.href = '#level-container';
            heroBtn.classList.remove('btn-primary'); 
            heroBtn.classList.add('btn-success', 'text-white');
        }
    }
}

// Logout Function
const logoutUser = () => {
    localStorage.removeItem("user_email"); // ইমেইল রিমুভ করছি
    window.location.reload();
}

// Run check
checkLoginStatus();


// ==============================================
// 2. LEARNING LOGIC (Lessons & Vocabularies)
// ==============================================

if (document.getElementById("level-container")) {

    const loadLessons = () => {
        fetch("https://openapi.programming-hero.com/api/levels/all")
            .then(res => res.json())
            .then(json => displayLessons(json.data))
            .catch(err => console.log("API Error:", err));
    }

    const removeActive = () => {
        const lessonButtons = document.querySelectorAll(".lesson-btn")
        lessonButtons.forEach((btn) => btn.classList.remove("active"))
    }

    // --- PROTECTED ROUTE (Updated for Email) ---
    window.loadLevelWord = (id) => {
        const userEmail = localStorage.getItem("user_email");
        
        if (!userEmail) {
            const confirmLogin = confirm("এই লেসনটি দেখতে হলে আপনাকে লগইন করতে হবে।");
            if (confirmLogin) {
                window.location.href = "login.html";
            }
            return;
        }

        const url = `https://openapi.programming-hero.com/api/level/${id}`
        fetch(url)
            .then(res => res.json())
            .then(data => {
                removeActive()
                const clickBtn = document.getElementById(`lesson-btn-${id}`)
                if(clickBtn) clickBtn.classList.add("active")
                displaylevelWords(data.data)
            })
            .catch(err => console.error(err));
    }

    const displaylevelWords = (words) => {
        const wordContainer = document.getElementById("word-container")
        wordContainer.innerHTML = "";

        if (words.length == 0) {
            wordContainer.innerHTML = `
           <div class="font-bangla text-center col-span-full">
                <img class="mx-auto mb-[10px] w-20" src="https://cdn-icons-png.flaticon.com/512/564/564619.png">
                <p class="text-[#79716B] text-[15px]">
                    এই Lesson এ এখনো কোন Vocabulary যুক্ত করা হয়নি।
                </p>
                <h2 class="font-semibold text-3xl mt-[15px]">নেক্সট Lesson এ যান</h2>
            </div>
            `;
            return;
        }

        words.forEach((word) => {
            const card = document.createElement("div")
            card.className = "h-full";
            card.innerHTML = `
            <div class="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 text-center py-10 px-5 h-full border border-gray-100">
                <h2 class="font-bold text-3xl text-primary mb-2">${word.word ? word.word : "N/A"}</h2>
                <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Meaning / Pronunciation</p>
                
                <div class="bg-gray-50 rounded-lg p-4 mb-6">
                    <div class="font-bangla font-bold text-[#18181B] text-xl">
                        "${word.meaning ? word.meaning : "অর্থ নেই"} / ${word.pronunciation ? word.pronunciation : "উচ্চারণ নেই"}"
                    </div>
                </div>

                <div class="flex justify-center gap-4">
                    <button class="btn btn-circle btn-outline btn-sm btn-info"><i class="fa-solid fa-info"></i></button>
                    <button class="btn btn-circle btn-outline btn-sm btn-success"><i class="fa-solid fa-volume-high"></i></button>
                </div>
            </div>`;

            wordContainer.append(card)
        });
    }

    const displayLessons = (lessons) => {
        const levelContainer = document.getElementById("level-container")
        levelContainer.innerHTML = "";

        for (let lesson of lessons) {
            const btnDiv = document.createElement("div")
            btnDiv.innerHTML = `
            <button id="lesson-btn-${lesson.level_no}" onclick="loadLevelWord(${lesson.level_no})" class="btn btn-outline btn-primary lesson-btn w-32 h-12 text-lg">
                Lesson ${lesson.level_no}
            </button>
            `
            levelContainer.append(btnDiv)
        }
    }

    loadLessons();
}