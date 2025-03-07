const apiKey = '1d970513410705c2aee167b7deba9f4c7233863d';
let emotionChart = null;
let confidenceChart = null;
let audioPlayer = null;

const emotions = {
    '-1.0': 'Rage 😡',
    '-0.8': 'Anger 😠',
    '-0.6': 'Sad 😞',
    '-0.4': 'Annoyed 😒',
    '-0.2': 'Meh 🙃',
    '0.0': 'Neutral 😐',
    '0.2': 'Content 🙂',
    '0.4': 'Happy 😊',
    '0.6': 'Excited 😃',
    '0.8': 'Overjoyed 🤩',
    '1.0': 'Ecstatic 🥳'
};

function initializeCharts() {
    const emotionCtx = document.getElementById('emotionChart').getContext('2d');
    const confidenceCtx = document.getElementById('confidenceChart').getContext('2d');

    // Create multiple gradient fills for different emotion ranges
    const positiveGradient = emotionCtx.createLinearGradient(0, 0, 0, 400);
    positiveGradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
    positiveGradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

    const neutralGradient = emotionCtx.createLinearGradient(0, 0, 0, 400);
    neutralGradient.addColorStop(0, 'rgba(79, 70, 229, 0.4)');
    neutralGradient.addColorStop(1, 'rgba(79, 70, 229, 0)');

    const negativeGradient = emotionCtx.createLinearGradient(0, 0, 0, 400);
    negativeGradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
    negativeGradient.addColorStop(1, 'rgba(239, 68, 68, 0)');

    emotionChart = new Chart(emotionCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Emotional Score',
                data: [],
                borderColor: function(context) {
                    const value = context.raw;
                    if (value > 0.2) return '#10B981';
                    if (value < -0.2) return '#EF4444';
                    return '#4F46E5';
                },
                backgroundColor: function(context) {
                    const value = context.raw;
                    if (value > 0.2) return positiveGradient;
                    if (value < -0.2) return negativeGradient;
                    return neutralGradient;
                },
                fill: true,
                tension: 0.4,
                pointBackgroundColor: function(context) {
                    const value = context.raw;
                    if (value > 0.2) return '#10B981';
                    if (value < -0.2) return '#EF4444';
                    return '#4F46E5';
                },
                pointBorderColor: '#FFFFFF',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart',
                onProgress: function(animation) {
                    animation.chart.data.datasets[0].pointRadius =
                        animation.currentStep / animation.numSteps * 6;
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 14
                    },
                    callbacks: {
                        label: (context) => {
                            const score = context.raw;
                            const closestEmotion = Object.entries(emotions).reduce((prev, curr) => {
                                return Math.abs(curr[0] - score) < Math.abs(prev[0] - score) ? curr : prev;
                            });
                            return `Score: ${score.toFixed(2)} - ${closestEmotion[1]}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1,
                    min: -1,
                    ticks: {
                        callback: function(value) {
                            return emotions[value.toFixed(1)] || '';
                        },
                        stepSize: 0.2,
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: theme => theme.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });

    confidenceChart = new Chart(confidenceCtx, {
        type: 'doughnut',
        data: {
            labels: ['High', 'Medium', 'Low'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    '#10B981',
                    '#F59E0B',
                    '#EF4444'
                ],
                borderWidth: 2,
                borderColor: theme => theme.dark ? '#374151' : '#FFFFFF',
                hoverBorderColor: theme => theme.dark ? '#4B5563' : '#F3F4F6',
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            animation: {
                animateScale: true,
                duration: 1500,
                easing: 'easeOutQuart'
            },
            layout: {
                padding: 20
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    display:false,
                    labels: {
                        boxWidth: 15,
                        boxHeight: 15,
                        padding: 15,
                        color: theme => theme.dark ? '#F9FAFB' : '#9abd1a',
                        font: {
                            size: 13,
                            weight: '500'
                        },
                        generateLabels: (chart) => {
                            const data = chart.data;
                            const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                            return data.labels.map((label, i) => ({
                                text: `${label} (${((data.datasets[0].data[i] / total) * 100).toFixed(1)}%)`,
                                fillStyle: data.datasets[0].backgroundColor[i],
                                hidden: isNaN(data.datasets[0].data[i]) || data.datasets[0].data[i] === 0,
                                index: i,
                                strokeStyle: data.datasets[0].backgroundColor[i]
                            }));
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: (context) => {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b);
                            const percentage = ((value / total) * 100).toFixed(1);
                            const label = context.label.split(' ')[0];
                            return `${label} Confidence: ${value} words (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeCharts();
    initializeAudioPlayer();

    // Get the transcription data from localStorage
    const transcriptionData = localStorage.getItem('transcriptionData');
    if (!transcriptionData) {
        document.getElementById('result').innerHTML = '<div class="segment">No transcription data available. Please transcribe an audio file first.</div>';
        return;
    }

    try {
        const data = JSON.parse(transcriptionData);
        const sentiment = data.results;
        const alternatives = sentiment.channels[0].alternatives;
        const words = alternatives[0].words;
        const segments = sentiment.sentiments.segments;

        // Update emotion chart
        emotionChart.data.labels = segments.map((_, index) => `${index + 1}`);
        emotionChart.data.datasets[0].data = segments.map(segment => segment.sentiment_score);
        emotionChart.update();

        // Calculate confidence distribution and overall score
        const confidenceCounts = { high: 0, medium: 0, low: 0 };
        let totalConfidence = 0;
        words.forEach(word => {
            totalConfidence += word.confidence;
            if (word.confidence > 0.9) confidenceCounts.high++;
            else if (word.confidence > 0.7) confidenceCounts.medium++;
            else confidenceCounts.low++;
        });

        const overallConfidence = (totalConfidence / words.length) * 100;
        document.getElementById('confidenceScore').innerHTML = `
            <div>Overall Confidence Score</div>
            <div style="font-size: 2rem; color: ${overallConfidence > 80 ? '#10B981' : overallConfidence > 60 ? '#F59E0B' : '#EF4444'}">
                ${overallConfidence.toFixed(1)}%
            </div>
        `;

        // Update confidence chart
        confidenceChart.data.datasets[0].data = [
            confidenceCounts.high,
            confidenceCounts.medium,
            confidenceCounts.low
        ];
        confidenceChart.update();

        // Display transcript
        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML = '';
        segments.forEach((segment, index) => {
            const segmentDiv = document.createElement('div');
            segmentDiv.classList.add('segment');

            // Get first and last word indexes from the segment metadata
            const startIdx = segment.start_word;
            const endIdx = segment.end_word;

            // Get word objects using indexes
            const allWords = sentiment.channels[0].alternatives[0].words;
            const startWordObj = allWords[startIdx];
            const endWordObj = allWords[endIdx];

            // Format times
            const startTime = startWordObj ? formatTime(startWordObj.start) : '00:00';
            const endTime = endWordObj ? formatTime(endWordObj.end) : '00:00';

            // Create sentiment tag
            const emotionMap = [
                { threshold: -0.85, emotion: '😡 Rage' },
                { threshold: -0.7, emotion: '😠 Anger' },
                { threshold: -0.55, emotion: '😞 Disappointment' },
                { threshold: -0.4, emotion: '😒 Annoyance' },
                { threshold: -0.2, emotion: '🙃 Sarcasm' },
                { threshold: -0.1, emotion: '😔 Sadness' },
                { threshold: 0.1, emotion: '😐 Neutral' },
                { threshold: 0.3, emotion: '🙂 Content' },
                { threshold: 0.5, emotion: '😊 Happy' },
                { threshold: 0.7, emotion: '😃 Excited' },
                { threshold: 0.85, emotion: '🤩 Overjoyed' },
                { threshold: Infinity, emotion: '🥳 Extremely Happy' }
            ];

            const emotion = emotionMap.find(e => segment.sentiment_score <= e.threshold).emotion;

            // Add segment header with timing and sentiment
            const segmentHeader = document.createElement('div');
            segmentHeader.classList.add('segment-header');
            segmentHeader.style.marginBottom = '8px';
            segmentHeader.style.color = 'var(--text-secondary)';
            segmentHeader.style.fontSize = '0.9rem';
            segmentHeader.innerHTML = `
        <span>Segment ${index + 1} | ${startTime} - ${endTime}</span>
        <span class="sentiment-tag">${emotion}</span>
    `;
            segmentDiv.appendChild(segmentHeader);

            // Add words with confidence colors
            const wordsInSegment = segment.text.split(' ');
            const wordMap = new Map(words.map(word => [word.word.toLowerCase(), word.confidence]));

            wordsInSegment.forEach(word => {
                const cleanWord = word.replace(/[.,!?]/g, '').toLowerCase();
                const confidence = wordMap.get(cleanWord);

                const wordSpan = document.createElement('span');
                wordSpan.textContent = word + ' ';

                if (confidence !== undefined) {
                    if (confidence > 0.7) {
                        wordSpan.classList.add('confidence-high');
                    } else if (confidence > 0.4) {
                        wordSpan.classList.add('confidence-medium');
                    } else {
                        wordSpan.classList.add('confidence-low');
                    }
                }

                segmentDiv.appendChild(wordSpan);
            });

            // Make segment clickable
            segmentDiv.style.cursor = 'pointer';
            segmentDiv.addEventListener('click', () => {
                // Remove active class from all segments
                document.querySelectorAll('.segment').forEach(seg => {
                    seg.classList.remove('active-segment');
                });

                // Add active class to clicked segment
                segmentDiv.classList.add('active-segment');

                // Play the segment audio
                playSegment(startTime, endTime);
            });

            resultDiv.appendChild(segmentDiv);
        });

        document.getElementById('status').innerHTML = '<span style="color: #10B981">✓</span> Analysis complete';

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('status').innerHTML = `<span style="color: #EF4444">✕</span> ${error.message}`;
        document.getElementById('result').innerHTML = `<div class="segment error">Error: ${error.message}</div>`;
    }
});

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// Add this helper function for time formatting
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function initializeAudioPlayer() {
    audioPlayer = document.getElementById('audioPlayer');
    const audioUrl = localStorage.getItem('audioUrl');
    if (audioUrl) {
        audioPlayer.src = audioUrl;
    }
}

// Modify the existing playSegment function
function playSegment(startTime, endTime) {
    if (!audioPlayer) return;

    // If audio is already playing, stop it first
    if (!audioPlayer.paused) {
        audioPlayer.pause();
    }

    // Convert MM:SS to seconds
    const start = startTime.split(':').reduce((acc, curr) => acc * 60 + parseInt(curr), 0);
    const end = endTime.split(':').reduce((acc, curr) => acc * 60 + parseInt(curr), 0);

    // Set start time and play
    audioPlayer.currentTime = start;
    audioPlayer.play();

    // Stop at end time
    const checkTime = () => {
        if (audioPlayer.currentTime >= end) {
            audioPlayer.pause();
            audioPlayer.removeEventListener('timeupdate', checkTime);
            // Remove active class when segment finishes
            document.querySelectorAll('.segment').forEach(seg => {
                seg.classList.remove('active-segment');
            });
        }
    };
    audioPlayer.addEventListener('timeupdate', checkTime);
}

document.addEventListener('click', (event) => {
    // Check if click target is not inside a segment
    const isSegmentClick = event.target.closest('.segment');
    if (!isSegmentClick && audioPlayer && !audioPlayer.paused) {
        audioPlayer.pause();
        // Remove active class from all segments
        document.querySelectorAll('.segment').forEach(seg => {
            seg.classList.remove('active-segment');
        });
    }
});