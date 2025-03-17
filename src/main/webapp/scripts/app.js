// Initialize global variables
let mediaRecorder;
let audioChunks = [];
let audioBlob;
let startTime;
let transcriptionStartTime;
let wavesurfer;
let confidenceChart = null;
let analysisPage = false;
let isProcessing = false;
let currentTranscriptionResult = null;
let isRecording = false;
let timerInterval;  // Add this to track the timer interval
let isTranscribing = false;
let grammarErrorCount = 0;

// Get DOM elements
const startButton = document.getElementById("startBtn");
const stopButton = document.getElementById("stopBtn");
const downloadButton = document.getElementById("downloadLink");
const audioFile = document.getElementById("audioFileInput");
const sendButton = document.getElementById("sendBtn");
const transcribeArea = document.getElementById("transcription");
const recordingStatus = document.getElementById("recordingStatus");
const timerDisplay = document.getElementById("recordingTimer");
const uploadStatus = document.getElementById("uploadStatus");
const fileName = document.getElementById("fileName");
const audioDetails = document.getElementById("detailedAudioInfo");
const copyButton = document.getElementById("copyBtn");
const modal = document.getElementById('transcriptionModal');
const expandBtn = document.getElementById('expandBtn');
const closeModal = document.querySelector('.close-modal');
const modalTranscription = document.getElementById('modalTranscription');
const playButton = document.getElementById('playBtn');
const currentTimeDisplay = document.getElementById('currentTime');
const totalDurationDisplay = document.getElementById('totalDuration');
const volumeControl = document.getElementById('volume');
const confidenceScoreDiv = document.getElementById('confidenceScore');
const confidenceCheckBox = document.getElementById('confidenceCheckBox');
const openAnalysisWindow = document.getElementById('speechAnalysisOpen');
const highlightedResult=document.getElementById("GrammarArea");
const toggleChangeHeader = document.getElementById('toggleChangeHeader');
const wpmValue = document.getElementById('wpmValue');
const fillerCountValue = document.getElementById('fillerCount');
const pauseCountValue = document.getElementById('pauseCount');

const pauseDetailsModal = document.getElementById('pauseDetailsModal');
const closePauseModal = document.querySelector('.close-pause-modal');
const pauseMetricContainer = document.querySelector('.metric-container:nth-child(2)');
const audioFileInput = document.getElementById("audioFileInput");
// Add data attribute for styling
pauseMetricContainer.setAttribute('data-metric', 'pauses');
const darkModeToggle = document.getElementById('darkModeToggle');
const grammarCountValue = document.getElementById('grammarErrorCount');
const transcriptionExpandBox = document.getElementById('transcriptionExpandBox');




document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById("logoutBtn");


    // ✅ Logout Event Listener (Calls LogoutServlet)
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            fetch("LogoutServlet", { method: "POST", credentials: "include" })
                .then(() => location.reload());
        });
    }



    // initializeUserPanel()
    // fetchUserJson();
    // initializeTranscriptionGrammarToggle();

    initializeDarkMode();
    grammarErrorCount = 0;
    console.log("Before wait");
    setTimeout(() => {
        initializeUserPanel();
        console.log("After 0.3 second");
    }, 300); // 2000ms = 2 seconds
    console.log("This runs immediately after 'Before wait'");

    fetchUserJson();
    initializeTranscriptionGrammarToggle();


})

// Initialize WaveSurfer
function initWaveSurfer() {
    wavesurfer = WaveSurfer.create({
        container: '#waveform',
        waveColor: '#4f46e5',
        progressColor: '#818cf8',
        cursorColor: '#c084fc',
        barWidth: 2,
        barGap: 1,
        height: 80,
        barRadius: 3,
    });

    wavesurfer.on('ready', () => {
        playButton.disabled = false;
        const duration = wavesurfer.getDuration();
        totalDurationDisplay.textContent = formatTime(duration * 1000);
    });

    wavesurfer.on('audioprocess', () => {
        const currentTime = wavesurfer.getCurrentTime();
        currentTimeDisplay.textContent = formatTime(currentTime * 1000);
    });

    wavesurfer.on('finish', () => {
        playButton.innerHTML = '<i class="ri-play-fill"></i>';
    });
}

// Initialize on page load
initWaveSurfer();

// Approximate transcription speed (bytes per second)
const TRANSCRIPTION_SPEED = (1024 * 1024) / 7; // ~146KB/s - Adjusted for realistic transcription speed

// Play/Pause functionality
playButton.addEventListener('click', () => {
    wavesurfer.playPause();
    const isPlaying = wavesurfer.isPlaying();
    playButton.innerHTML = isPlaying ?
        '<i class="ri-pause-fill"></i>' :
        '<i class="ri-play-fill"></i>';
});

// Volume control
volumeControl.addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    wavesurfer.setVolume(volume);
});

// Copy functionality
copyButton.addEventListener('click', () => {
    navigator.clipboard.writeText(transcribeArea.value)
        .then(() => {
            const originalText = copyButton.innerHTML;
            copyButton.innerHTML = '<i class="ri-check-line"></i>';
            setTimeout(() => {
                copyButton.innerHTML = originalText;
            }, 2000);
        })
        .catch(err => console.error('Failed to copy text:', err));
});

// Modal functionality
expandBtn.addEventListener('click', () => {
    const grammarToggle = document.getElementById('grammarToggle');
    modal.classList.add('active');
    if (grammarToggle.checked) {
        modalTranscription.innerHTML = document.getElementById('GrammarArea').innerHTML;
    }
    else {
        modalTranscription.innerText = transcribeArea.value;
    }
});



closeModal.addEventListener('click', () => {
    modal.classList.remove('active');
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
    }
});

function formatTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / 1000 / 60) % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateTimer() {
    const currentTime = Date.now() - startTime;
    timerDisplay.textContent = formatTime(currentTime);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function estimateRemainingTime(fileSize) {
    const estimatedSeconds = Math.ceil(fileSize / TRANSCRIPTION_SPEED);
    const elapsed = (Date.now() - transcriptionStartTime) / 1000;
    const remaining = Math.max(0, estimatedSeconds - elapsed);
    const minutes = Math.floor(remaining / 60);
    const seconds = Math.floor(remaining % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function truncateFileName(fileName, maxLength = 40) {
    return fileName.length > maxLength ? fileName.substring(0, maxLength) + '...' : fileName;
}


async function updateDetailedAudioInfo(blob) {
    if (blob) {
        const duration = formatTime(Date.now() - startTime);
        const size = formatFileSize(blob.size);
        audioDetails.innerHTML = `
            <div class="detail-item">
                <strong>Duration:</strong> ${duration}
            </div>
            <div class="detail-item">
                <strong>Size:</strong> ${size}
            </div>
            <div class="detail-item">
                <strong>Type:</strong> ${blob.type}
            </div>
        `;

        // Load audio into WaveSurfer
        const audioUrl = URL.createObjectURL(blob);
        wavesurfer.load(audioUrl);

        clearpreviousResult();
        let audioLink = await uploadAudioToCloudinary(blob);
        let options = {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };

        // Format date in IST
        let formattedDate = new Intl.DateTimeFormat('en-IN', options).format(new Date());
        // Replace characters to create a valid filename format
        formattedDate = formattedDate.replace(/\//g, '-').replace(/, /g, '_').replace(/:/g, '-');
        let audioFileName = `recording_${formattedDate}.wav`;
        await saveAudioToDatabase(audioFileName, audioLink.secure_url);
        await transcribeAudio();
    } else {
        audioDetails.textContent = 'No audio selected';
        playButton.disabled = true;
    }
}

startButton.addEventListener('click', async () => {
    try {
        clearpreviousResult();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.start();
        isRecording = true;
        startTime = Date.now();

        // Start the timer
        timerInterval = setInterval(updateTimer, 1000);

        startButton.disabled = true;
        stopButton.disabled = false;
        recordingStatus.textContent = "Recording...";
        recordingStatus.className = "status recording";

    } catch (error) {
        console.error("Error accessing microphone:", error);
        recordingStatus.textContent = "Error: Could not access microphone";
    }
});

// Update the disableControls function
function disableControls() {
    startButton.disabled = true;
    audioFileInput.disabled = true;
    sendButton.disabled = true;
    audioFile.disabled = true;
}

// Update the enableControls function
function enableControls() {
    if (!isTranscribing) {
        startButton.disabled = false;
        audioFileInput.disabled = false;
        sendButton.disabled = false;
        audioFile.disabled = false;
    }
}

stopButton.addEventListener('click', () => {
    // Clear the timer interval
    clearInterval(timerInterval);
    // Reset timer display to 00:00
    timerDisplay.textContent = "00:00";

    mediaRecorder.stream.getTracks().forEach(track => track.stop());

    startButton.disabled = false;
    stopButton.disabled = true;
    recordingStatus.textContent = "";
    recordingStatus.className = "status";

    mediaRecorder.onstop = async () => {
        audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        await updateDetailedAudioInfo(audioBlob);

        // Enable controls after recording is complete
        downloadButton.style.display = "inline-flex";
        downloadButton.href = URL.createObjectURL(audioBlob);
        downloadButton.download = "recording.wav";
        sendButton.disabled = false;
    };
});

audioFile.accept = "audio/*";
audioFile.addEventListener('change', async (event) => {
    if (isProcessing) {
        alert('Please wait for the current audio to finish processing.');
        audioFile.value = ''; // Clear the file input
        return;
    }

    const file = event.target.files[0];
    if (file) {
        if (!file.type.startsWith('audio/')) {
            alert('Please select an audio file. Supported formats include MP3, WAV, OGG, etc.');
            audioFile.value = '';
            return;
        }

        isProcessing = true;
        disableControls();

        try {
            audioBlob = file;
            fileName.textContent = file.name;
            const audioUrl = URL.createObjectURL(file);
            wavesurfer.load(audioUrl);

            audioDetails.innerHTML = `
                <div class="detail-item">
                    <strong>Name:</strong> ${file.name}
                </div>
                <div class="detail-item">
                    <strong>Size:</strong> ${formatFileSize(file.size)}
                </div>
                <div class="detail-item">
                    <strong>Type:</strong> ${file.type}
                </div>
            `;
            clearpreviousResult();
            let audioLink = await uploadAudioToCloudinary(audioBlob);
            let audioFileName = file.name;
            await saveAudioToDatabase(audioFileName, audioLink.secure_url);
            await transcribeAudio();
        } catch (error) {
            console.error('Error processing audio:', error);
            alert('Error processing audio. Please try again.');
        } finally {
            isProcessing = false;
            enableControls();
        }
    }
});

let loadingDots;

function startLoadingAnimation(statusElement, fileSize) {
    let dots = 0;
    statusElement.className = "status loading";
    transcriptionStartTime = Date.now();

    loadingDots = setInterval(() => {
        dots = (dots + 1) % 4;
        const remainingTime = estimateRemainingTime(fileSize);
        const estimateText = `Transcribing${'.'.repeat(dots)} (Est. ${remainingTime} remaining)`;
        // statusElement.textContent = estimateText;
        document.getElementById('transcriptionEstimate').textContent = estimateText;
    }, 500);
}

function stopLoadingAnimation() {
    if (loadingDots) {
        clearInterval(loadingDots);
        loadingDots = null;
        document.getElementById('transcriptionEstimate').textContent = '';
    }
}

async function transcribeAudio() {
    if (!audioBlob) {
        alert("Please record audio or upload a file first");
        return;
    }

    sendButton.disabled = true;
    transcribeArea.value = "Transcription is in progress...";
    if (confidenceChart) {
        confidenceChart.destroy();
        confidenceScoreDiv.style.display = "none";
    }
    confidenceCheckBox.style.display = "block";
    confidenceCheckBox.value = "Analysing the speech...";

    const statusElement = uploadStatus;
    startLoadingAnimation(statusElement, audioBlob.size);

    try {
        await sendToDeepgram(audioBlob);
    } catch (error) {
        statusElement.textContent = "Transcription failed";
        statusElement.className = "status error";
        console.error("Error during transcription:", error);
    } finally {
        stopLoadingAnimation();
        sendButton.disabled = false;
        statusElement.textContent = "";
        statusElement.className = "status";
    }
}

sendButton.addEventListener('click', transcribeAudio);

function clearpreviousResult() {
    transcribeArea.value = "Setting Up...";
    highlightedResult.innerHTML = "Make everything to ready for new analysis";
    confidenceScoreDiv.style.display = "none";

    // Reset toggle state to show transcription
    const grammarToggle = document.getElementById('grammarToggle');
    const transcription = document.getElementById('transcription');
    const grammarArea = document.getElementById('GrammarArea');
    grammarToggle.checked = false; // Reset to transcription view
    transcription.style.display = 'block';
    grammarArea.style.display = 'none';
}

async function sendToDeepgram(audioBlob) {
    highlightedResult.innerHTML = "Processing audio...";

    try {
        if (!(audioBlob instanceof Blob)) {
            throw new Error("Invalid audio format. Expected a Blob.");
        }

        // Ensure the correct MIME type
        const file = new File([audioBlob], "audio.wav", { type: "audio/wav" });

        // Create FormData and append the audio file
        const formData = new FormData();
        formData.append("audio", file);

        const userId = sessionStorage.getItem('userId');
        localStorage.setItem('audioName', audioBlob.name);
        console.log("audio file name - " + audioBlob.name);
        console.log("User ID:", userId);
        formData.append("userId", userId);

        // Send the audio file to the servlet
        const response = await fetch("transcription", {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Servlet error: ${response.status} ${response.statusText}`);
        }

        // Parse JSON response
        const result = await response.json();
        console.log("Transcription API Response:", result);
        console.log("Hello");

        // Display transcription if available
        if (result.results && result.results.channels[0].alternatives[0].transcript) {
            currentTranscriptionResult = result;
            analysisPage = true;
            initializeCharts();
            transcribeArea.value = result.results && result.results.channels[0].alternatives[0].transcript;
            confidenceCheckBox.style.display = 'none';
            console.log("before grammar");
            updateSpeechConfidence(result);
            checkGrammar(result.results.channels[0].alternatives[0].transcript);
            localStorage.setItem('transcriptionData', JSON.stringify(result));
            console.log("Transcription", result.results.channels[0].alternatives[0].transcript);
            overallAnalysisLoader(result);
            fetchUserJson();
            // Ensure toggle state is applied after setting transcription
            const grammarToggle = document.getElementById('grammarToggle');
            const transcription = document.getElementById('transcription');
            const grammarArea = document.getElementById('GrammarArea');
            if (grammarToggle.checked) {
                toggleChangeHeader.textContent = "Grammar";
                transcriptionExpandBox.innerText = "Grammar";
                transcription.style.display = 'none';
                grammarArea.style.display = 'block';
            } else {
                toggleChangeHeader.textContent = "Transcription";
                transcriptionExpandBox.innerText = "Transcription";
                transcription.style.display = 'block';
                grammarArea.style.display = 'none';
            }
        } else {
            transcribeArea.value = "No transcription available.";
        }
    } catch (error) {
        console.error("Error:", error);
        transcribeArea.value = "Transcription error. Try again.";
    }
}

//grammar area
async function checkGrammar(text) {
    grammarErrorCount = 0;
    try {
        console.log("Text being sent:", text);
        // Prepare the form data with the text to check
        // const formData = new FormData();
        // formData.append("text", text);

        const params = new URLSearchParams();
        params.append("text", text);

        // Send the text to your servlet for grammar checking
        const response = await fetch("checkGrammar", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });

        if (!response.ok) {
            throw new Error(`Grammar check servlet error: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();

        // Display the grammar check result
        analyzeAndReplaceErrors(result, text);

        const grammarToggle = document.getElementById('grammarToggle');
        const transcription = document.getElementById('transcription');
        const grammarArea = document.getElementById('GrammarArea');
        if (grammarToggle.checked) {
            toggleChangeHeader.textContent = "Grammar";
            transcription.style.display = 'none';
            grammarArea.style.display = 'block';
        } else {
            toggleChangeHeader.textContent = "Transcription";
            transcription.style.display = 'block';
            grammarArea.style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking grammar:', error);
    }
}

function displayGrammarResult(result, text) {
    highlightedResult.innerHTML = '';
    if (result.matches.length === 0) {
        console.log('No grammar errors found!');
        highlightedResult.innerHTML = 'No grammar errors found!';
    } else {
        let highlightedText = text;
        result.matches.forEach(match => {
            // Filter out hyphen, spelling mistake, and uppercase errors
            if (!match.message.includes('article') &&
                !match.message.includes('hyphen') &&
                !match.message.includes('spelling') &&
                !match.message.includes('uppercase')&&
                !match.message.includes('comma')) {
                const error = document.createElement('p');
                error.innerHTML = `Error: ${match.message}<br>Suggestion: ${match.replacements.map(r => r.value).join(', ')}`;

                const errorText = text.substring(match.offset, match.offset + match.length);
                const replacementText = match.replacements.length > 0 ? match.replacements[0].value : '';
                const highlightedErrorText = `<span class="highlight">${errorText}</span><span class="replacement"> (${replacementText})</span>`;
                highlightedText = highlightedText.replace(errorText, highlightedErrorText);
            }
        });
        highlightedResult.innerHTML = highlightedText;
    }
}

function analyzeAndReplaceErrors(jsonObject, text) {
    grammarErrorCount = 0;
    let textArray = text.split(""); // Convert text to an array for easy manipulation
    console.log(textArray);

    let wordsArray = text.split(" ");
    console.log(wordsArray);

    // Sort matches in reverse order to prevent index shifting
    jsonObject.matches
        .sort((a, b) => b.offset - a.offset) // Sort by offset descending
        .forEach(match => {
            const { offset, length, replacements } = match;
            if (replacements.length > 0) {
                if(!match.message.includes('article') &&
                    !match.message.includes('hyphen') &&
                    !match.message.includes('spelling') &&
                    !match.message.includes('uppercase')&&
                    !match.message.includes('comma')&&
                    !match.message.includes("successive sentences")){
                    grammarErrorCount+=1;
                    const replacementText = replacements[0].value;
                    const errorText = text.substring(match.offset, match.offset + match.length);
                    const replacementText2 = `<span class="highlight">${errorText}</span><span class="replacement"> (${replacementText})</span>`;
                    textArray.splice(offset, length, ...replacementText2.split("")); // Replace text correctly
                }
            }

        });
    grammarCountValue.innerText = grammarErrorCount;
    highlightedResult.innerHTML= textArray.join(""); // Convert back to a string
}






function initializeCharts() {
    const canvas = document.getElementById('confidenceChart');

    // Set the size dynamically
    canvas.width = 220;  // Set width
    canvas.height = 220; // Set height

    const confidenceCtx = canvas.getContext('2d');

    if (confidenceChart) {
        confidenceChart.destroy();
    }

    confidenceChart = new Chart(confidenceCtx, {
        type: 'doughnut',
        data: {
            labels: ['High Confidence', 'Medium Confidence', 'Low Confidence'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    '#10B981',
                    '#F59E0B',
                    '#EF4444'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

function updateSpeechConfidence(resultJson) {
    const sentiment = resultJson.results;
    const alternatives = sentiment.channels[0].alternatives;
    const words = alternatives[0].words;
    const segments = sentiment.sentiments.segments;

    // Calculate confidence distribution and overall score
    const confidenceCounts = { high: 0, medium: 0, low: 0 };
    let totalConfidence = 0;
    words.forEach(word => {
        totalConfidence += word.confidence;
        if (word.confidence > 0.9) confidenceCounts.high++;
        else if (word.confidence > 0.7) confidenceCounts.medium++;
        else confidenceCounts.low++;
    });

    confidenceScoreDiv.style.display = "flex";

    const overallConfidence = (totalConfidence / words.length) * 100;
    confidenceScoreDiv.innerHTML = `
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
}

openAnalysisWindow.addEventListener('click', () => {
    if (analysisPage) {
        window.open("analysis.html", "_blank");
    }
})

// History modal functionality
const historyButton = document.getElementById("historyButton");
const historyModal = document.getElementById("historyModal");
const closeHistory = document.querySelector(".close-history");

if (historyButton) {
    historyButton.addEventListener("click", () => {
        historyModal.classList.add("history-active");
        // Close user panel if open
        const userPanel = document.getElementById("userPanel");
        if (userPanel) {
            userPanel.style.display = "none";
        }
        const userIcon = document.getElementById("userIcon");
        if (userIcon) {
            userIcon.style.boxShadow = "purple 2px 2px 5px";
        }

        // Fetch history data here
        // fetchTranscriptionHistory();
    });
}

if (closeHistory) {
    closeHistory.addEventListener("click", () => {
        historyModal.classList.remove("history-active");
    });
}

// Close history modal when clicking outside
historyModal.addEventListener("click", (e) => {
    if (e.target === historyModal) {
        historyModal.classList.remove("history-active");
    }
});

function fetchUserJson() {
    const historyList = document.getElementById("historyList");
    if (!historyList) return;

    historyList.innerHTML = '<p class="loading">Loading history...</p>';

    fetch("getUserJson")
        .then(response => handleHistoryResponse(response))
        .then(data => processHistoryData(data, historyList))
        .catch(error => handleHistoryError(error, historyList));
}

function handleHistoryResponse(response) {
    if (!response.ok) {
        throw new Error("User not logged in or session expired");
    }
    return response.json();
}

function processHistoryData(data, historyList) {
    if (data.length === 0) {
        historyList.innerHTML = '<p class="no-history">No transcription history available</p>';
        return;
    }

    const historyData = data.map(item => JSON.parse(item));
    setupHistoryUI(historyData, historyList);
}

function setupHistoryUI(historyData, historyList) {
    // Initial render
    renderHistoryItems(historyData, historyList);

    // Setup search
    setupHistorySearch(historyData, historyList);

    // Setup sorting
    setupHistorySort(historyData, historyList);
}

function renderHistoryItems(items, historyList) {
    historyList.innerHTML = '';
    if (items.length === 0) {
        historyList.innerHTML = '<p class="no-history">No matching results</p>';
        return;
    }

    items.forEach((eachItem, idx) => {
        const historyItem = createHistoryItem(eachItem, idx);
        historyList.appendChild(historyItem);
    });
}

function createHistoryItem(eachItem, idx) {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item-container';
    historyItem.innerHTML = `
        <div class="history-item">
            <div class="history-item-header">
                <span class="history-item-title">${eachItem.file_name || `Transcription ${idx + 1}`}</span>
            </div>
        </div>
        <button class="delete-history-btn" title="Delete">
            <i class="ri-delete-bin-line"></i>
        </button>
    `;

    // Add event handlers...
    const header = historyItem.querySelector('.history-item-title');
    header.addEventListener('click', () => handleHistoryItemClick(eachItem));
    const headerPadding = historyItem.querySelector('.history-item-header');
    headerPadding.addEventListener('click', () => handleHistoryItemClick(eachItem));
    const deleteBtn = historyItem.querySelector('.delete-history-btn');
    deleteBtn.addEventListener('click', (e) => deleteHistoryItem(eachItem.file_id, historyItem));

    return historyItem;
}

async function deleteHistoryItem(fileId, element) {
    if (!confirm('Are you sure you want to delete this transcription?')) {
        return;
    }

    try {
        const response = await fetch('deleteTranscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `fileId=${fileId}`
        });

        if (!response.ok) {
            throw new Error('Failed to delete transcription');
        }

        element.style.opacity = '0';
        setTimeout(() => {
            element.remove();
            // Check if history is empty
            const historyList = document.getElementById('historyList');
            if (!historyList.children.length) {
                historyList.innerHTML = '<p class="no-history">No transcription history available</p>';
            }
        }, 300);
    } catch (error) {
        console.error('Error deleting transcription:', error);
        alert('Failed to delete transcription. Please try again.');
    }
}

async function handleHistoryItemClick(eachItem) {
    try {
        const audioUrl = await getAudioUrl(eachItem.file_id);
        if (audioUrl) {
            localStorage.setItem('audioUrl', audioUrl);
            downloadButton.style.display = "none";
            clearpreviousResult();
            audioDetails.textContent = eachItem.file_name;
            loadAudioFromPath(audioUrl);
            loadUserData(eachItem);
        }
    } catch (error) {
        console.error('Error loading audio:', error);
    }
}

function setupHistorySearch(historyData, historyList) {
    const searchInput = document.getElementById('historySearch');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredItems = filterHistoryItems(historyData, searchTerm);
        renderHistoryItems(filteredItems, historyList);
    });
}

function filterHistoryItems(historyData, searchTerm) {
    return historyData.filter(item =>
        item.file_name.toLowerCase().includes(searchTerm) ||
        item.results.channels[0].alternatives[0].transcript.toLowerCase().includes(searchTerm)
    );
}

function setupHistorySort(historyData, historyList) {
    const sortSelect = document.getElementById('historySort');
    sortSelect.addEventListener('change', (e) => {
        const sortedItems = sortHistoryItems(historyData, e.target.value);
        renderHistoryItems(sortedItems, historyList);
    });
}

function sortHistoryItems(items, sortOption) {
    const sortedItems = [...items];
    switch (sortOption) {
        case 'newest':
            return sortedItems; // Keep original order (newest first)
        case 'oldest':
            return sortedItems.reverse(); // Reverse the array for oldest first
        case 'nameAZ':
            return sortedItems.sort((a, b) => a.file_name.localeCompare(b.file_name));
        case 'nameZA':
            return sortedItems.sort((a, b) => b.file_name.localeCompare(a.file_name));
        default:
            return sortedItems;
    }
}

function handleHistoryError(error, historyList) {
    console.error("Error fetching JSON:", error);
    historyList.innerHTML = '<p class="error">Failed to load transcription history</p>';
}

// function loadUserData(result) {
//     // loadAudioFromPath('https://res.cloudinary.com/dyzgttahp/video/upload/v1740393675/nlsgps3upgfz4p845fhm.mp3');
//     currentTranscriptionResult = result;
//     analysisPage = true;
//     console.log(history.state)
//     historyModal.classList.remove("history-active");
//     initializeCharts();
//     transcribeArea.value = result.results.channels[0].alternatives[0].transcript;
//     confidenceCheckBox.style.display = 'none';
//     console.log("before grammar");
//     updateSpeechConfidence(result);
//     overallAnalysisLoader(result);
//     checkGrammar(result.results.channels[0].alternatives[0].transcript);
//     localStorage.setItem('transcriptionData', JSON.stringify(result));
//     console.log("Transcription using loadUserData", result.results.channels[0].alternatives[0].transcript);
// }


function loadUserData(result) {
    grammarErrorCount = 0;
    if (result.results.channels[0].alternatives[0].transcript == "") {
        transcribeArea.value = 'No transcription available.';
        historyModal.classList.remove("history-active");
        initializeCharts();
        analysisPage = false;
        if (confidenceChart) {
            confidenceChart.destroy();
            confidenceScoreDiv.style.display = "none";
        }
        return;
    }
    currentTranscriptionResult = result;
    analysisPage = true;
    historyModal.classList.remove("history-active");
    initializeCharts();
    transcribeArea.value = result.results.channels[0].alternatives[0].transcript;
    confidenceCheckBox.style.display = 'none';
    updateSpeechConfidence(result);
    overallAnalysisLoader(result);
    checkGrammar(result.results.channels[0].alternatives[0].transcript);
    localStorage.setItem('transcriptionData', JSON.stringify(result));
}



function loadAudioFromPath(audioPath) {
    // Fetch the audio file from the provided path
    fetch(audioPath, {
        method: 'GET',
        headers: {
            'Content-Type': 'audio/mpeg',
            // 'Access-Control-Allow-Origin': '*' // Allow CORS
        }
    })
        .then(response => response.blob())
        .then(file => {
            audioBlob = file;
            sendButton.disabled = false;

            // Set the file name from the path
            const fileName = audioPath.split('/').pop();
            document.querySelector('#fileName').textContent = fileName;

            // Create an object URL for the audio file and load it into wavesurfer
            const audioUrl = URL.createObjectURL(file);
            wavesurfer.load(audioUrl);
        })
        .catch(error => console.error('Error loading the audio file:', error));
}

async function uploadAudioToCloudinary(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "audio_upload");

    const progressContainer = document.getElementById('uploadProgressContainer');
    const progressBar = document.getElementById('uploadProgress');
    const progressText = document.getElementById('uploadProgressText');

    try {
        progressContainer.style.display = 'block';

        // Create a Promise to handle the XMLHttpRequest
        const response = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    progressBar.value = percentComplete;
                    progressText.textContent = `${Math.round(percentComplete)}%`;
                }
            });

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.response));
                } else {
                    reject(new Error(`Upload failed: ${xhr.status}`));
                }
            };

            xhr.onerror = () => reject(new Error('Network error'));

            xhr.open('POST', 'https://api.cloudinary.com/v1_1/dyzgttahp/video/upload');
            xhr.send(formData);
        });

        return response;
    } catch (error) {
        console.error("Error uploading audio:", error);
        throw error;
    } finally {
        progressContainer.style.display = 'none';
    }
}

async function saveAudioToDatabase(fileName, audioLink) {
    try {
        // Create form data
        localStorage.setItem("audioUrl", audioLink);
        const formData = new FormData();
        formData.append('fileName', fileName);
        formData.append('audioLink', audioLink);

        // Create URLSearchParams for x-www-form-urlencoded
        const params = new URLSearchParams();
        params.append('fileName', fileName);
        params.append('audioLink', audioLink);

        const response = await fetch('saveaudio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            credentials: 'include', // Include cookies for session
            body: params.toString()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Audio saved successfully:', data);
        console.log('Saved file name:', fileName);
        console.log('Saved audio link:', audioLink);
    } catch (error) {
        console.error('Error saving audio:', error);
    }
}

async function getAudioUrl(fileId) {
    try {
        const response = await fetch('getAudioUrl', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `fileId=${fileId}`
        });

        if (!response.ok) {
            throw new Error('Failed to fetch audio URL');
        }

        const data = await response.json();
        return data.audioUrl;
    } catch (error) {
        console.error('Error fetching audio URL:', error);
        return null;
    }
}


function initializeDarkMode() {

    const darkModeToggle = document.getElementById('darkModeToggle');
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    darkModeToggle.checked = savedTheme === 'dark';

    // Add toggle event listener
    darkModeToggle.addEventListener('change', function() {
        const theme = this.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    });
}


function initializeUserPanel() {
    const userIcon = document.getElementById("userIcon");
    const userPanel = document.getElementById("userPanel");
    const userName = sessionStorage.getItem('userName') || 'User';
    const userEmail = sessionStorage.getItem('userEmail') || '';

    // Set the first letter in userIcon
    const firstLetter = userName.charAt(0).toUpperCase();
    userIcon.innerHTML = `<div class="profile-letter">${firstLetter}</div>`;

    // Create user info section
    const userInfo = document.createElement('div');
    userInfo.className = 'user-info';
    userInfo.innerHTML = `
        <div class="name">${userName}</div>
        <div class="email">${userEmail}</div>
    `;
    userPanel.insertBefore(userInfo, userPanel.firstChild);

    // Event handlers for panel
    userIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleUserPanel();
    });

    document.addEventListener("click", (e) => {
        if (!userIcon.contains(e.target) && !userPanel.contains(e.target)) {
            hideUserPanel();
        }
    });
}

function toggleUserPanel() {
    const userIcon = document.getElementById("userIcon");
    const userPanel = document.getElementById("userPanel");

    if (userPanel.classList.contains("show")) {
        hideUserPanel();
    } else {
        showUserPanel();
    }
}

function showUserPanel() {
    const userIcon = document.getElementById("userIcon");
    const userPanel = document.getElementById("userPanel");

    userPanel.style.display = "block";
    userIcon.style.boxShadow = "violet 2px 2px 5px";
    requestAnimationFrame(() => {
        userPanel.classList.add("show");
    });
}

function hideUserPanel() {
    const userIcon = document.getElementById("userIcon");
    const userPanel = document.getElementById("userPanel");

    userPanel.classList.remove("show");
    userIcon.style.boxShadow = "purple 2px 2px 5px";
    setTimeout(() => {
        userPanel.style.display = "none";
    }, 300);
}
// document.addEventListener("DOMContentLoaded", fetchUserJson);

// Add this after your DOM element declarations
function initializeTranscriptionGrammarToggle() {
    const grammarToggle = document.getElementById('grammarToggle');
    const transcription = document.getElementById('transcription');
    const grammarArea = document.getElementById('GrammarArea');

    // Initial state: show transcription, hide grammar
    transcription.style.display = 'block';
    grammarArea.style.display = 'none';

    grammarToggle.addEventListener('change', () => {
        if (grammarToggle.checked) {
            // Show Grammar Check, hide Transcription
            toggleChangeHeader.textContent = "Grammar";
            transcriptionExpandBox.innerText = "Grammar";
            transcription.style.display = 'none';
            grammarArea.style.display = 'block';
        } else {
            // Show Transcription, hide Grammar Check
            toggleChangeHeader.textContent = "Transcription";
            transcriptionExpandBox.innerText = "Transcription";
            transcription.style.display = 'block';
            grammarArea.style.display = 'none';
        }
    });
}

function calculateOverallWPM(jsonData) {
    try {
        // Check if the required structure exists
        const alternatives = jsonData.results.channels[0].alternatives[0];
        if (!alternatives || !alternatives.words) {
            throw new Error('JSON lacks required structure (words)');
        }

        // Calculate overall WPM
        const totalWords = alternatives.words.length;
        const duration = jsonData.metadata.duration / 60; // Convert seconds to minutes
        const overallWPM = (totalWords / duration).toFixed(2);
        return overallWPM;
    } catch (error) {
        console.error('Error calculating WPM:', error.message);
        return null; // Return null on error
    }
}

function analyzeFillerWords(transcriptionData) {
    const fillerWords = ["um", "uh", "ah", "er", "mm", "eh", "hmm", "oh"];

    try {
        // Parse the transcription data
        const data = transcriptionData;
        const sentiment = data.results;
        const alternatives = sentiment.channels[0].alternatives;
        const words = alternatives[0].words;

        // Initialize stats object
        const fillerStats = {};
        let totalFillerCount = 0;

        // Analyze words for fillers
        words.forEach(wordObj => {
            const lowerCaseWord = wordObj.word.toLowerCase();
            if (fillerWords.includes(lowerCaseWord)) {
                if (!fillerStats[lowerCaseWord]) {
                    fillerStats[lowerCaseWord] = 0;
                }
                fillerStats[lowerCaseWord]++;
                totalFillerCount++;
            }
        });

        // Store result in a variable before returning
        const analysisResult = {
            totalFillerWords: totalFillerCount,
            fillerWordCounts: fillerStats
        };

        return analysisResult;

    } catch (error) {
        console.error('Error analyzing filler words:', error.message);
        // Store error result in a variable before returning
        const errorResult = {
            totalFillerWords: 0,
            fillerWordCounts: {},
            error: error.message
        };

        return errorResult;
    }
}

function findGapsWithFillers(transcriptionJson, threshold) {
    const fillerWords = ["um", "uh", "like", "so", "you know", "well", "er", "ah"];
    const words = transcriptionJson.results.channels[0].alternatives[0].words;

    const gapsWithFillers = [];

    try {
        for (let i = 0; i < words.length - 1; i++) {
            const currentWord = words[i];
            const nextWord = words[i + 1];
            const endTime = currentWord.end;
            const nextStartTime = nextWord.start;
            const gapDuration = nextStartTime - endTime;

            if (gapDuration > threshold) {
                let hasFillers = false;
                for (let j = Math.max(0, i - 5); j < Math.min(words.length, i + 6); j++) {
                    const word = words[j];
                    const wordStart = word.start;
                    const wordEnd = word.end;
                    const rawWord = word.word.toLowerCase();

                    if ((wordEnd <= endTime && endTime - wordEnd <= 1) ||
                        (wordStart >= nextStartTime && wordStart - nextStartTime <= 1) ||
                        (wordStart <= endTime && wordEnd >= nextStartTime)) {
                        if (fillerWords.includes(rawWord)) {
                            hasFillers = true;
                            break;
                        }
                    }
                }

                if (hasFillers) {
                    const gap = {
                        start: endTime,
                        end: nextStartTime,
                        duration: gapDuration
                    };
                    gapsWithFillers.push(gap);
                }
            }
        }

        return gapsWithFillers;

    } catch (error) {
        console.error('Error finding gaps with fillers:', error.message);
        return [];
    }
}

function formatTimeForDisplay(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function showPauseDetails(gaps) {
    const tbody = document.querySelector('#pauseDetailsTable tbody');
    tbody.innerHTML = '';

    gaps.forEach((gap, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${formatTimeForDisplay(gap.start)}</td>
            <td>${formatTimeForDisplay(gap.end)}</td>
            <td>${gap.duration.toFixed(1)}s</td>
        `;
        tbody.appendChild(row);
    });

    pauseDetailsModal.classList.add('active');
    addPauseRowClickHandlers();
}

// Event Listeners
pauseMetricContainer.addEventListener('click', () => {
    const gaps = findGapsWithFillers(currentTranscriptionResult, 1);
    showPauseDetails(gaps);
});

closePauseModal.addEventListener('click', () => {
    pauseDetailsModal.classList.remove('active');
});

pauseDetailsModal.addEventListener('click', (e) => {
    if (e.target === pauseDetailsModal) {
        pauseDetailsModal.classList.remove('active');
    }
});

function addPauseRowClickHandlers() {
    const tbody = document.querySelector('#pauseDetailsTable tbody');
    tbody.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        if (!row) return;

        const startTime = row.cells[1].textContent;
        const endTime = row.cells[2].textContent;

        // Play segment with 2 seconds padding before and after
        playAudioSegment(startTime, endTime, 2);

        // Highlight the active row
        const activeRow = tbody.querySelector('.active-row');
        if (activeRow) activeRow.classList.remove('active-row');
        row.classList.add('active-row');
    });
}

function parseTimeToSeconds(timeStr) {
    const [minutes, seconds] = timeStr.split(':').map(Number);
    return minutes * 60 + seconds;
}

function playAudioSegment(startTime, endTime, padding) {
    if (!wavesurfer) return;

    // Convert times to seconds if they're strings
    if (typeof startTime === 'string') startTime = parseTimeToSeconds(startTime);
    if (typeof endTime === 'string') endTime = parseTimeToSeconds(endTime);

    // Add padding to start and end times
    const paddedStart = Math.max(0, startTime - padding);
    const paddedEnd = Math.min(wavesurfer.getDuration(), endTime + padding);

    // Set the play region
    wavesurfer.setTime(paddedStart);
    wavesurfer.play();

    // Listen for timeupdate to stop at end time
    const timeUpdateHandler = () => {
        if (wavesurfer.getCurrentTime() >= paddedEnd) {
            wavesurfer.pause();
            wavesurfer.un('timeupdate', timeUpdateHandler);
        }
    };

    wavesurfer.on('timeupdate', timeUpdateHandler);
}

function overallAnalysisLoader(result) {
    wpmValue.innerText = calculateOverallWPM(result);
    fillerCountValue.innerText = analyzeFillerWords(result).totalFillerWords;
    let gapFounder = findGapsWithFillers(result, 1);
    pauseCountValue.innerText = gapFounder.length;
}

// export default outputJSON;