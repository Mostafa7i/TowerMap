
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

    const clamp = (val) => Math.min(Math.max(val, 0), 100);
    const scores = {
        lat: clamp(100 - (lat / 2)),
        pl: clamp(100 - pl * 10),
        jit: clamp(100 - jit * 5),
        thr: clamp((thr / 100) * 100),
    };

    // 1. Latency
    if (scores.lat < 40) {
        recs.push({
            type: "critical",
            category: "connectivity",
            icon: "🚨",
            text: `زمن الاستجابة بلغ مستوى حرجاً (${lat}ms) — البرج قد يكون متوقفاً أو يعاني اختناقاً شديداً في الشبكة.`,
            action: [
                `فحص فوري لوصلات الميكروويف أو الألياف الضوئية المتصلة بالبرج`,
                `التحقق من حالة الـ Router والـ Switch المرتبطَين`,
                `مراجعة جداول التوجيه (Routing Tables) للكشف عن مسارات معطوبة`,
                `إعادة تشغيل خدمة الشبكة إذا لم تُكشف مشكلة في الأجهزة`,
            ],
        });
    } else if (scores.lat < 70) {
        recs.push({
            type: "warning",
            category: "latency",
            icon: "⏱",
            text: `زمن الاستجابة مرتفع نسبياً (${lat}ms) — يُنصح بمراجعة مسار الشبكة وتقليل عدد القفزات.`,
            action: [
                `تشغيل traceroute لتحديد نقطة التأخير`,
                `مراجعة جودة الوصلة البينية بين البرج والـ Core Network`,
            ],
        });
    }

    // 2. Packet Loss
    if (scores.pl < 40) {
        recs.push({
            type: "critical",
            category: "packet-loss",
            icon: "💀",
            text: `فقدان الحزم وصل لمستوى حرج (${pl}%) — جودة الخدمة تنهار وتتطلب تدخلاً فورياً.`,
            action: [
                `فحص الكابلات والموصلات الفيزيائية للبرج`,
                `التحقق من وجود تشويش (interference) على القناة اللاسلكية`,
                `مراجعة إعدادات QoS وتأكيد عمل آلية الـ Error Correction`,
                `تجهيز بديل (failover) فوري لضمان استمرارية الخدمة`,
            ],
        });
    } else if (scores.pl < 70) {
        recs.push({
            type: "warning",
            category: "packet-loss",
            icon: "📦",
            text: `نسبة فقدان الحزم في منطقة تحذيرية (${pl}%) — جودة البيانات تتأثر بشكل ملحوظ.`,
            action: [
                `مراقبة حركة البيانات خلال الـ 24 ساعة القادمة`,
                `فحص إعدادات buffers والـ queue على الأجهزة`,
            ],
        });
    }

    // 3. Jitter
    if (scores.jit < 40) {
        recs.push({
            type: "critical",
            category: "quality",
            icon: "〰️",
            text: `تذبذب التأخير (Jitter) حرج جداً (${jit}ms) — خدمات الصوت والفيديو متأثرة بشدة.`,
            action: [
                `مراجعة تكوين الـ QoS وتفعيل أولوية حزم الصوت (VoIP Priority)`,
                `فحص اكتظاظ الشبكة في أوقات الذروة`,
                `النظر في رفع سعة النطاق الترددي أو تحديث معدات الشبكة`,
            ],
        });
    } else if (scores.jit < 70) {
        recs.push({
            type: "warning",
            category: "quality",
            icon: "〰️",
            text: `تذبذب التأخير غير مستقر (${jit}ms) — قد يؤثر على جودة خدمات الصوت (VoIP) والمكالمات.`,
            action: [
                `فحص مصادر التشويش الكهرومغناطيسي في محيط البرج`,
                `مراجعة إعدادات الـ Jitter Buffer على المعدات`,
            ],
        });
    }

    // 4. Throughput
    if (scores.thr < 40) {
        recs.push({
            type: "critical",
            category: "traffic",
            icon: "⚡",
            text: `سرعة النقل ضعيفة جداً (${thr} Mbps) — الشبكة تعاني عجزاً واضحاً في السعة.`,
            action: [
                `التحقق من وجود هجمات DDoS أو ضغط مرور غير طبيعي`,
                `مراجعة حدود الـ Rate Limiting على الـ Uplink`,
                `النظر في ترقية الوصلة أو تفعيل ضغط البيانات`,
            ],
        });
    } else if (scores.thr < 70) {
        recs.push({
            type: "warning",
            category: "traffic",
            icon: "📶",
            text: `سرعة النقل أقل من المتوقع (${thr} Mbps) — يجب مراجعة استهلاك عرض النطاق الترددي.`,
            action: [
                `تحليل أنماط حركة البيانات وتحديد التطبيقات الأكثر استهلاكاً`,
                `مراجعة عقود الـ SLA مع مزود الخدمة`,
            ],
        });
    }

    // 5. AI Risk
    if (p >= 75) {
        recs.push({
            type: "critical",
            category: "ai-alert",
            icon: "🤖",
            text: `الذكاء الاصطناعي يكشف خطراً حرجاً (${p.toFixed(0)}%) — تدخّل فوري من الفريق التقني وإعادة توجيه المسار.`,
            action: [
                `تفعيل بروتوكول الطوارئ وإخطار مدير الشبكة فوراً`,
                `إعادة توجيه حركة المرور عبر البرج الاحتياطي`,
                `تسجيل الحادثة في سجل المشاكل وفتح تذكرة عالية الأولوية`,
            ],
        });
    } else if (p >= 40) {
        recs.push({
            type: "warning",
            category: "ai-alert",
            icon: "⚠️",
            text: `الذكاء الاصطناعي يرصد ارتفاعاً في احتمالية المخاطرة (${p.toFixed(0)}%) — مراقبة مكثفة مطلوبة.`,
            action: [
                `رفع تكرار جمع البيانات إلى كل دقيقة`,
                `إخطار المهندس المسؤول لمتابعة الوضع`,
            ],
        });
    }

    // Optimal state
    if (recs.length === 0) {
        recs.push({
            type: "success",
            category: "status",
            icon: "✅",
            text: `جميع المؤشرات تتطابق مع المعايير المطلوبة — البرج يعمل بكفاءة ممتازة ولا يوجد ما يستدعي التدخل.`,
            action: [
                `استمر في المراقبة الدورية ضمن الجدول الزمني المعتاد`,
                `تأكد من تحديث firmware الأجهزة وفق آخر إصدار`,
            ],
        });
    }

    return recs;
};