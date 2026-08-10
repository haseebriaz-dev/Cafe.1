
        const hamburger = document.getElementById('hamburger-toggle');
        const navMenu = document.getElementById('nav-menu');

        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Menu link par click karte hi menu band ho jaye
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    
        // Typewriter Effect Variables
        const textArray = ["Finest Taste Ever","Cozy Place", "CR Special Pizza", "BBQ & Tandoor", "CR Special Karahi", "CR Special Handi"];
        const typingDelay = 100; // ٹائپ ہونے کی سپیڈ
        const erasingDelay = 50; // ریموو ہونے کی سپیڈ
        const newTextDelay = 2000; // نیا لفظ آنے سے پہلے کتنا رکے
        let textArrayIndex = 0;
        let charIndex = 0;
        
        const textElement = document.getElementById("rotating-text");
        
        function type() {
            if (charIndex < textArray[textArrayIndex].length) {
                textElement.textContent += textArray[textArrayIndex].charAt(charIndex);
                charIndex++;
                setTimeout(type, typingDelay);
            } else {
                setTimeout(erase, newTextDelay);
            }
        }
        
        function erase() {
            if (charIndex > 0) {
                textElement.textContent = textArray[textArrayIndex].substring(0, charIndex - 1);
                charIndex--;
                setTimeout(erase, erasingDelay);
            } else {
                textArrayIndex++;
                // جب لسٹ ختم ہو جائے تو واپس پہلے لفظ (cozy place) پر چلا جائے
                if (textArrayIndex >= textArray.length) textArrayIndex = 0;
                setTimeout(type, typingDelay + 500);
            }
        }
        
        // جب پیج لوڈ ہو تو یہ فنکشن چل جائے
        document.addEventListener("DOMContentLoaded", function() {
            if(textArray.length) setTimeout(type, newTextDelay);
        });
