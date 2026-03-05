// 게임 매니저: 이벤트 리스너 및 전역 상태 관리
// 싱글톤 패턴으로 하나만 유지
const gridManager = new GridManager();

// 전역 게임 상태
window.isGameRunning = false;
window.isPaused = false;
let totalScore = 0;

// 타이머 변수
const MAX_TIME = 60; // 60초
let timeRemaining = MAX_TIME;
let timerInterval = null;

// DOM 요소
const btnStart = document.getElementById('btn-start');
const btnPause = document.getElementById('btn-pause');
const startScreen = document.getElementById('start-screen');
const pauseScreen = document.getElementById('pause-screen');
const timerBar = document.getElementById('timer-bar');
const tutorialOverlay = document.getElementById('tutorial-overlay');
const btnCloseTutorial = document.getElementById('btn-close-tutorial');

// 초기화: 게임 화면이 로드되면 먼저 랜덤 오브젝트를 꽉 채워둠
document.addEventListener('DOMContentLoaded', () => {
    // 반응형 스케일 적용
    handleResize();
    window.addEventListener('resize', handleResize);

    setTimeout(() => {
        gridManager.addRandomObject();
    }, 100);
});

// 화면 크기에 맞춰 전체 게임 크기를 조절하는 함수
function handleResize() {
    const wrapper = document.querySelector('.game-wrapper');
    if (!wrapper) return;

    // 현재 뷰포트 크기
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 기준이 되는 게임의 너비 (그리드 너비 + 여백 약 540px)
    const baseWidth = 540;
    // 기준이 되는 게임의 높이 (상단정보 + 그리드 + 하단정보 약 850px)
    // 실제 요소의 높이를 측정하여 사용
    const baseHeight = wrapper.scrollHeight || 850;

    // 가로/세로 중 더 많이 줄여야 하는 비율을 선택
    const scaleX = (viewportWidth * 0.95) / baseWidth;
    const scaleY = (viewportHeight * 0.95) / baseHeight;

    // 너무 커지지 않도록 최대 1배 (PC에서는 원래 크기), 모바일에서는 꽉 차게
    const scale = Math.min(scaleX, scaleY, 1);

    // 전역 변수에 저장 (inputManager에서 좌표 계산 시 사용)
    window.gameScale = scale;

    // CSS transform으로 스케일 조정
    wrapper.style.transform = `scale(${scale})`;
    wrapper.style.transformOrigin = 'center center';
}

// 게임 시작 버튼 이벤트
btnStart.addEventListener('click', () => {
    startGame();
});

// 튜토리얼 닫기 버튼 이벤트
btnCloseTutorial.addEventListener('click', () => {
    tutorialOverlay.style.display = 'none';
});

// 일시정지 버튼 이벤트
btnPause.addEventListener('click', () => {
    if (!window.isGameRunning) return;
    togglePause();
});

function startGame() {
    window.isGameRunning = true;
    startScreen.style.display = 'none';
    btnPause.disabled = false;

    // 타이머 시작
    timeRemaining = MAX_TIME;
    updateTimerUI();

    resumeTimer();
}

function resumeTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeRemaining -= 0.1; // 0.1초씩 감소
        updateTimerUI();

        if (timeRemaining <= 0) {
            endGame();
        }
    }, 100);
}

function togglePause() {
    window.isPaused = !window.isPaused;

    if (window.isPaused) {
        pauseScreen.style.display = 'flex';
        btnPause.innerText = '계속하기';

        // 타이머 확실히 중지
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        // 혹시라도 발생 중인 드래그 이벤트를 강제 취소
        if (typeof inputManager !== 'undefined' && inputManager.forceCancelDrag) {
            inputManager.forceCancelDrag();
        }
    } else {
        pauseScreen.style.display = 'none';
        btnPause.innerText = '일시정지';

        // 타이머 재개
        resumeTimer();
    }
}

function endGame() {
    window.isGameRunning = false;
    clearInterval(timerInterval);
    btnPause.disabled = true;

    // 게임 오버 처리
    setTimeout(() => {
        alert(`게임 오버! 최종 점수: ${totalScore}`);
        location.reload();
    }, 100);
}

function updateTimerUI() {
    const percentage = (timeRemaining / MAX_TIME) * 100;

    // 음수가 되지 않도록 방어
    const safePercentage = Math.max(0, percentage);
    timerBar.style.width = `${safePercentage}%`;

    // 색상 변경 로직
    if (safePercentage <= 20) {
        timerBar.className = 'timer-bar danger';
    } else if (safePercentage <= 50) {
        timerBar.className = 'timer-bar warning';
    } else {
        timerBar.className = 'timer-bar';
    }
}