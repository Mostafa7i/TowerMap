
/**
 * دالة تحليل بيانات البرج واستخراج التوصيات
 * @param {Object} stats - كائن يحتوي على (latency, packetLoss, jitter, throughput)
 * @param {number} prob - نسبة الخطر (0-100)
 * @param {boolean} isAnomaly - هل يوجد شذوذ مكتشف بواسطة الـ AI
 * @returns {Array} - مصفوفة من كائنات التوصيات
 */
export const getRecommendations = (stats, prob, isAnomaly) => {
    const recs = [];
    const lat = parseFloat(stats?.latency)    || 0;
    const pl  = parseFloat(stats?.packetLoss) || 0;
    const jit = parseFloat(stats?.jitter)     || 0;
    const thr = parseFloat(stats?.throughput) || 0;
    const p   = parseFloat(prob)              || 0;

    // 1. تحليل الـ Latency
    if (lat > 300 || lat === 999) {
        recs.push({ 
            type: "critical", 
            category: "connectivity",
            text: "الـ Latency بلغ مستوى حرجاً — البرج قد يكون متوقفاً أو غير قابل للوصول", 
            icon: "🚨",
            action: "فحص فوري لوصلات الميكروويف أو الألياف الضوئية"
        });
    } else if (lat > 100) {
        recs.push({ 
            type: "warning", 
            category: "latency",
            text: "الـ Latency مرتفع — يُنصح بمراجعة مسار الشبكة وتقليل القفزات", 
            icon: "⏱" 
        });
    }

    // 2. تحليل فقدان الحزم (Packet Loss)
    if (pl >= 100) {
        recs.push({ 
            type: "critical", 
            category: "outage",
            text: "فقدان حزم كامل (100%) — البرج متوقف فعلياً عن الاتصال", 
            icon: "💀" 
        });
    } else if (pl > 20) {
        recs.push({ 
            type: "critical", 
            category: "packet-loss",
            text: "فقدان حزم حرج — فحص الاتصالات والمعدات فوري", 
            icon: "📦" 
        });
    } else if (pl > 5) {
        recs.push({ 
            type: "warning", 
            category: "packet-loss",
            text: "نسبة فقدان الحزم تتجاوز 5% — فحص الكابلات والمعدات", 
            icon: "📦" 
        });
    }

    // 3. تحليل الـ Jitter
    if (jit > 100) {
        recs.push({ 
            type: "critical", 
            category: "quality",
            text: "الـ Jitter حرج جداً — الخدمة الصوتية والمرئية متأثرة بشدة", 
            icon: "〰" 
        });
    } else if (jit > 20) {
        recs.push({ 
            type: "warning", 
            category: "quality",
            text: "الـ Jitter غير مستقر — قد يؤثر على خدمات الصوت والفيديو", 
            icon: "〰" 
        });
    }

    // 4. تحليل معدل النقل (Throughput)
    if (thr === 0) {
        recs.push({ 
            type: "critical", 
            category: "traffic",
            text: "معدل النقل صفر — لا يوجد أي اتصال نشط", 
            icon: "⚡" 
        });
    } else if (thr < 10) {
        recs.push({ 
            type: "warning", 
            category: "traffic",
            text: "معدل النقل منخفض جداً — فحص عرض النطاق الترددي", 
            icon: "⚡" 
        });
    }

    // 5. تحليل استنتاج الذكاء الاصطناعي
    if (isAnomaly && p >= 75) {
        recs.push({ 
            type: "critical", 
            category: "ai-alert",
            text: "الذكاء الاصطناعي يكشف خطراً حرجاً — تدخل فوري من الفريق التقني", 
            icon: "🤖" 
        });
    } else if (isAnomaly && p >= 50) {
        recs.push({ 
            type: "warning", 
            category: "ai-alert",
            text: "الذكاء الاصطناعي يرصد شذوذاً — جدولة صيانة وقائية خلال 24 ساعة", 
            icon: "⚠️" 
        });
    }

    // حالة الأمان
    if (recs.length === 0) {
        recs.push({ 
            type: "success", 
            category: "status",
            text: "جميع المؤشرات ضمن النطاق الطبيعي — البرج يعمل بكفاءة مثلى", 
            icon: "✅" 
        });
    }

    return recs;
};