import { useState } from "react";

export default function App() {
    // ===== STATE VARIABLES =====
    const [text, setText] = useState("");
    const [feedback, setFeedback] = useState([]);
    const [showBurnConfirm, setShowBurnConfirm] = useState(false);
    const [insightScore, setInsightScore] = useState(null);
    const [contributeToArchive, setContributeToArchive] = useState(false);
    const [archiveMessage, setArchiveMessage] = useState("");

    // ===== MODULE 1, FEATURE 3: DRAFT DESTRUCTION SIMULATOR =====
    const handleBurn = () => {
        if (text.trim()) {
            setShowBurnConfirm(true);
        }
    };

    const confirmBurn = () => {
        setText("");
        setShowBurnConfirm(false);
    };

    // ===== MODULE 2, FEATURE 3: NARRATIVE COMPLETION CHECKLIST =====
    const checkNarrative = () => {
        const words = text.split(/\s+/).length;
        const hasBeginning = /^(once|start|begin|first|initially)/i.test(text);
        const hasTurningPoint = /(but|then|however|suddenly|although)/i.test(text);
        const hasConclusion = /(finally|now|end|ultimately|in conclusion)/i.test(text);

        let result = [];

        if (words < 30) {
            result.push("✏️ Write at least 30 words for a complete story.");
        } else {
            result.push("✅ Word count: " + words + " words.");
        }

        if (!hasBeginning) {
            result.push("📖 Add a clear beginning or introduction.");
        } else {
            result.push("✅ Has a clear beginning.");
        }

        if (!hasTurningPoint) {
            result.push("🔄 Add a turning point or change.");
        } else {
            result.push("✅ Has a turning point.");
        }

        if (!hasConclusion) {
            result.push("✅ Add a conclusion or resolution.");
        } else {
            result.push("✅ Has a conclusion.");
        }

        if (hasBeginning && hasTurningPoint && hasConclusion) {
            result.push("🎉 Great job! Your story is complete!");
        }

        setFeedback(result);
    };

    // ===== MODULE 3, FEATURE 3: INSIGHT WORD DENSITY METRIC =====
    const calculateInsightDensity = () => {
        const growthWords = [
            'learned', 'grew', 'reconstructed', 'understood', 'realized',
            'progress', 'healed', 'accepted', 'stronger', 'overcame',
            'discovered', 'evolved', 'transformed', 'adapted', 'embraced'
        ];
        const words = text.toLowerCase().split(/\s+/);
        let count = 0;
        words.forEach(word => {
            if (growthWords.includes(word)) {
                count++;
            }
        });
        setInsightScore(count);
    };

    // ===== MODULE 4, FEATURE 3: ANONYMIZED WISDOM ARCHIVE CONTRIBUTION =====
    const handleArchiveSubmit = () => {
        if (!contributeToArchive) {
            setArchiveMessage("⚠️ Please check the box to confirm you want to share anonymously.");
            return;
        }
        if (text.trim().length < 10) {
            setArchiveMessage("⚠️ Please write a longer story before submitting to the archive.");
            return;
        }
        setArchiveMessage("✅ Thank you! Your anonymous story has been added to the Wisdom Archive.");
    };

    // ===== MAIN APP UI =====
    return (
        <div className="min-h-screen bg-stone-950 text-stone-100">
            <header className="border-b border-stone-800 px-8 py-5">
                <h1 className="text-xl font-semibold tracking-tight">
                    Narrative<span className="text-emerald-400">Rebuild</span>
                    <span className="ml-3 text-sm font-normal text-stone-400">
                        writing studio
                    </span>
                </h1>
            </header>

            <main className="mx-auto max-w-3xl px-8 py-10">
                {/* ===== MAIN WRITING AREA ===== */}
                <div className="mb-6">
                    <h2 className="text-lg font-medium">Your Writing</h2>
                    <p className="text-sm text-stone-400 mb-4">
                        Write freely. Your words are private and safe.
                    </p>
                </div>

                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Write your thoughts here..."
                    className="w-full h-48 bg-stone-800/50 text-stone-100 rounded-lg p-4 border border-stone-700 focus:border-emerald-400 focus:outline-none resize-none"
                />

                {/* ===== MODULE 1, FEATURE 3: DRAFT DESTRUCTION SIMULATOR ===== */}
                <section className="mt-12 border-t border-stone-800 pt-10">
                    <h2 className="text-lg font-medium">🔥 Draft Destruction Simulator</h2>
                    <p className="text-sm text-stone-400 mb-4">
                        Permanently burn a raw writing sample instead of saving it to the database.
                    </p>

                    <button
                        onClick={handleBurn}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition"
                    >
                        Burn Draft
                    </button>
                </section>

                {/* ===== MODULE 2, FEATURE 3: NARRATIVE COMPLETION CHECKLIST ===== */}
                <section className="mt-12 border-t border-stone-800 pt-10">
                    <h2 className="text-lg font-medium">✅ Narrative Completion Checklist</h2>
                    <p className="text-sm text-stone-400 mb-4">
                        Checks if your writing has a clear beginning, turning point, and conclusion.
                    </p>

                    <button
                        onClick={checkNarrative}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-medium transition"
                    >
                        Check Narrative Structure
                    </button>

                    {feedback.length > 0 && (
                        <div className="mt-4 p-4 bg-stone-800/30 rounded-lg border border-stone-700">
                            {feedback.map((item, index) => (
                                <p key={index} className="text-sm text-stone-300 py-1">
                                    {item}
                                </p>
                            ))}
                        </div>
                    )}
                </section>

                {/* ===== MODULE 3, FEATURE 3: INSIGHT WORD DENSITY METRIC ===== */}
                <section className="mt-12 border-t border-stone-800 pt-10">
                    <h2 className="text-lg font-medium">📊 Insight Word Density</h2>
                    <p className="text-sm text-stone-400 mb-4">
                        Counts growth-related vocabulary to calculate your Post-Traumatic Growth Index.
                    </p>

                    <button
                        onClick={calculateInsightDensity}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition"
                    >
                        Calculate Growth Index
                    </button>

                    {insightScore !== null && (
                        <div className="mt-4 p-4 bg-stone-800/30 rounded-lg border border-stone-700">
                            <p className="text-stone-300">
                                <span className="font-medium">Post-Traumatic Growth Index:</span> {insightScore}
                            </p>
                            <p className="text-sm text-stone-400 mt-1">
                                {insightScore < 3 && "Try incorporating more reflection and growth words like 'learned', 'grew', or 'reconstructed'."}
                                {insightScore >= 3 && "Great reflection! Your writing shows meaningful cognitive processing."}
                            </p>
                        </div>
                    )}
                </section>

                {/* ===== MODULE 4, FEATURE 3: ANONYMIZED WISDOM ARCHIVE CONTRIBUTION ===== */}
                <section className="mt-12 border-t border-stone-800 pt-10">
                    <h2 className="text-lg font-medium">📚 Wisdom Archive Contribution</h2>
                    <p className="text-sm text-stone-400 mb-4">
                        Submit an anonymous version of your story to help others on their healing journey.
                    </p>

                    <div className="flex items-center gap-3 mb-4">
                        <input
                            type="checkbox"
                            checked={contributeToArchive}
                            onChange={() => setContributeToArchive(!contributeToArchive)}
                            className="w-5 h-5 accent-emerald-500"
                        />
                        <label className="text-stone-300">I agree to remove my name and identifying details.</label>
                    </div>

                    <button
                        onClick={handleArchiveSubmit}
                        className="px-6 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-white font-medium transition"
                    >
                        Submit to Archive
                    </button>

                    {archiveMessage && (
                        <div className="mt-4 p-4 bg-stone-800/30 rounded-lg border border-stone-700">
                            <p className="text-sm text-stone-300">{archiveMessage}</p>
                        </div>
                    )}
                </section>
            </main>

            {/* ===== BURN CONFIRMATION POPUP ===== */}
            {showBurnConfirm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
                    <div className="bg-stone-900 p-8 rounded-xl max-w-md w-full border border-stone-700">
                        <h2 className="text-xl font-bold text-red-400">🔥 Burn this draft?</h2>
                        <p className="text-stone-400 mt-2">
                            This action cannot be undone. Your writing will be permanently destroyed.
                        </p>
                        <div className="mt-6 flex gap-4">
                            <button
                                onClick={confirmBurn}
                                className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition"
                            >
                                Yes, Burn It
                            </button>
                            <button
                                onClick={() => setShowBurnConfirm(false)}
                                className="px-6 py-2 bg-stone-700 hover:bg-stone-600 rounded-lg text-white font-medium transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}