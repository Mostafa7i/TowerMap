
/**
 * دالة تحليل بيانات البرج واستخراج التوصيات
 * @param {Object} stats - كائن يحتوي على (latency, packetLoss, jitter, throughput)
 * @param {number} prob - نسبة الخطر (0-100)
 * @param {boolean} isAnomaly - هل يوجد شذوذ مكتشف بواسطة الـ AI
 * @returns {Array} - مصفوفة من كائنات التوصيات
 */
export const getRecommendations = (stats, prob, isAnomaly) => {
    const recs = [];
    const lat = parseFloat(stats?.latency) || 0;
    const pl = parseFloat(stats?.packetLoss) || 0;
    const jit = parseFloat(stats?.jitter) || 0;
    const thr = parseFloat(stats?.throughput) || 0;
    const p = parseFloat(prob) || 0;

    // Helper للصحة
    const clamp = (val) => Math.min(Math.max(val, 0), 100);
    const scores = {
        lat: clamp(100 - (lat / 2)),
        pl: clamp(100 - pl * 10),
        jit: clamp(100 - jit * 5),
        thr: clamp((thr / 100) * 100)
    };

    // 1. تحليل الـ Latency
    if (scores.lat < 40) {
        recs.push({
            type: "critical",
            category: "connectivity",
            text: `الـ Latency بلغ مستوى حرجاً (${lat}ms) — البرج قد يكون متوقفاً أو يعاني اختناقاً شديداً`,
            icon: "🚨",
            action: "فحص فوري لوصلات الميكروويف أو الألياف الضوئية"
        });
    } else if (scores.lat < 70) {
        recs.push({
            type: "warning",
            category: "latency",
            text: `الـ Latency مرتفع نسبياً (${lat}ms) — يُنصح بمراجعة مسار الشبكة وتقليل القفزات`,
            icon: "⏱"
        });
    }

    // 2. تحليل فقدان الحزم (Packet Loss)
    if (scores.pl < 40) {
        recs.push({
            type: "critical",
            category: "packet-loss",
            text: `فقدان حزم حرج (${pl}%) — جودة الخدمة تنهار، فحص الاتصالات والمعدات فوري`,
            icon: "💀"
        });
    } else if (scores.pl < 70) {
        recs.push({
            type: "warning",
            category: "packet-loss",
            text: `نسبة فقدان الحزم تحذيرية (${pl}%) — جودة البيانات تتأثر بشكل ملحوظ`,
            icon: "📦"
        });
    }

    // 3. تحليل الـ Jitter
    if (scores.jit < 40) {
        recs.push({
            type: "critical",
            category: "quality",
            text: `الـ Jitter حرج جداً (${jit}ms) — الخدمة الصوتية والمرئية متأثرة بشدة`,
            icon: "〰"
        });
    } else if (scores.jit < 70) {
        recs.push({
            type: "warning",
            category: "quality",
            text: `الـ Jitter غير مستقر (${jit}ms) — قد يؤثر على استقرار خدمات الصوت (VoIP)`,
            icon: "〰"
        });
    }

    // 4. تحليل معدل النقل (Throughput)
    if (scores.thr < 40) {
        recs.push({
            type: "critical",
            category: "traffic",
            text: `معدل النقل ضعيف جداً (${thr} Mbps) — الشبكة تواجه عجزاً في السعة`,
            icon: "⚡"
        });
    } else if (scores.thr < 70) {
        recs.push({
            type: "warning",
            category: "traffic",
            text: `معدل النقل أقل من المتوقع (${thr} Mbps) — يجب فحص عرض النطاق الترددي`,
            icon: "⚡"
        });
    }

    // 5. تحليل استنتاج الذكاء الاصطناعي ونسبة الخطر الشاملة
    if (p >= 75) {
        recs.push({
            type: "critical",
            category: "ai-alert",
            text: "الذكاء الاصطناعي يكشف خطراً حرجاً — تدخّل فوري من الفريق التقني وإعادة توجيه المسار",
            icon: "🤖"
        });
    } else if (p >= 40) {
        recs.push({
            type: "warning",
            category: "ai-alert",
            text: "الذكاء الاصطناعي يرصد ارتفاعاً في نسبة المخاطرة المُركّبة — تتطلب مراقبة مكثفة",
            icon: "⚠️"
        });
    }

    // حالة الأمان
    if (recs.length === 0) {
        recs.push({
            type: "success",
            category: "status",
            text: "جميع المؤشرات تتطابق مع المعايير المطلوبة — البرج يعمل بكفاءة ممتازة",
            icon: "✅"
        });
    }

    return recs;
};