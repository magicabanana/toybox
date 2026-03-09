const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

ctx.imageSmoothingEnabled = false;

// 1. 애니메이션 상태별 이미지와 프레임 수 관리
// 앞으로 추가할 이미지 이름과 프레임 수를 이곳에 적어주세요!
// 폴더에 없는 이미지는 임시로 네모 박스로 표시됩니다.
const animations = {
    idle: { src: 'player_idle.png', frames: 4, image: new Image() },
    run: { src: 'player_run.png', frames: 5, image: new Image() },
    jump: { src: 'player_jump.png', frames: 1, image: new Image() },
    attack: { src: 'player_attack.png', frames: 3, image: new Image() }
};

// 이미지 소스 설정 (실제 파일 로드 시작)
for (let key in animations) {
    animations[key].image.src = animations[key].src;
}

// 프레임 정보 설정 (모든 스프라이트의 한 프레임 크기가 32x32라고 가정)
const frameWidth = 32;
const frameHeight = 32;

let currentFrame = 0;
let lastDrawTime = 0;
const frameInterval = 1000 / 12; // 12fps

// 플레이어 객체 상태 관리
const player = {
    x: canvas.width / 2 - (32 * 3) / 2,
    y: canvas.height / 2 - (32 * 3) / 2,
    speed: 250,
    direction: 1, // 1: 오른쪽, -1: 왼쪽
    scale: 3,

    // 현재 재생 중인 애니메이션 상태 (우선순위: 공격 > 점프 > 이동 > 대기)
    currentState: 'idle',

    isAttacking: false, // 공격 중일 때는 다른 모션으로 안 바뀌게 제어
    velocityY: 0,
    isJumping: false
};

// 중력과 점프 파워 설정
const gravity = 1000;
const jumpPower = -450;

// 키 입력 상태 추적
const keys = {
    a: false, A: false, ArrowLeft: false, // 왼쪽 이동
    d: false, D: false, ArrowRight: false, // 오른쪽 이동
    w: false, W: false, ArrowUp: false, // 점프
    " ": false // 스페이스바 (공격)
};

window.addEventListener('keydown', (e) => {
    const key = e.key;
    if (keys.hasOwnProperty(key)) {
        keys[key] = true;
    }

    // 공격 키 입력 (연타되지 않고 1회만 발동되도록 제어)
    if (key === ' ' && !player.isAttacking) {
        player.isAttacking = true;
        currentFrame = 0; // 공격 프레임 처음부터 시작
    }

    // 점프 키 입력 (땅에 있을 때만 가능)
    if ((key === 'w' || key === 'W' || key === 'ArrowUp') && !player.isJumping) {
        player.velocityY = jumpPower;
        player.isJumping = true;
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key;
    if (keys.hasOwnProperty(key)) {
        keys[key] = false;
    }
});

let lastTime = 0;

function update(deltaTime, timestamp) {
    let isMovingX = false;

    // 1. 공격 중이 아닐 때만 이동 가능 (보통 공격할 땐 발이 묶이는 형태)
    if (!player.isAttacking) {
        // 왼쪽 이동
        if (keys.a || keys.A || keys.ArrowLeft) {
            player.x -= player.speed * deltaTime;
            player.direction = -1;
            isMovingX = true;
        }
        // 오른쪽 이동
        if (keys.d || keys.D || keys.ArrowRight) {
            player.x += player.speed * deltaTime;
            player.direction = 1;
            isMovingX = true;
        }
    }

    // 2. 물리 적용 (중력 및 상하 이동)
    player.velocityY += gravity * deltaTime;
    player.y += player.velocityY * deltaTime;

    // 바닥 충돌 처리 (캔버스 바닥을 땅으로 가정)
    const groundY = canvas.height - (frameHeight * player.scale);
    if (player.y >= groundY) {
        player.y = groundY;
        player.velocityY = 0;
        player.isJumping = false;
    }

    // 화면 밖으로 못 나가게 (좌우 경계선)
    const scaledWidth = frameWidth * player.scale;
    if (player.x < 0) player.x = 0;
    if (player.x + scaledWidth > canvas.width) player.x = canvas.width - scaledWidth;

    // 3. 애니메이션 상태(State) 갱신
    let nextState = 'idle';

    if (player.isAttacking) {
        nextState = 'attack';
    } else if (player.isJumping) {
        nextState = 'jump';
    } else if (isMovingX) {
        nextState = 'run';
    } else {
        nextState = 'idle';
    }

    // 상태가 바뀌면 애니메이션 프레임을 0으로 초기화
    if (player.currentState !== nextState) {
        player.currentState = nextState;
        currentFrame = 0;
        lastDrawTime = timestamp; // 방금 상태가 바뀌었으므로 타이머를 리셋 (첫 번째 프레임 스킵 방지)
    }
}

function draw(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    update(deltaTime, timestamp); // timestamp 추가 전달

    if (!lastDrawTime) lastDrawTime = timestamp;
    const elapsed = timestamp - lastDrawTime;

    // 현재 플레이어 상태에 맞는 애니메이션 정보 가져오기
    const currentAnim = animations[player.currentState];

    // 프레임 업데이트 로직
    if (elapsed > frameInterval) {
        currentFrame++;
        lastDrawTime = timestamp;

        // 공격 애니메이션이 끝났는지 확인 (한 번만 재생)
        if (player.currentState === 'attack' && currentFrame >= currentAnim.frames) {
            player.isAttacking = false;
            // 다음 프레임 루프에서 자연스럽게 다른 상태(idle 등)로 넘어가도록 처리
            currentFrame = currentAnim.frames - 1;
        } else {
            // 그 외 애니메이션은 무한 반복 (루프)
            currentFrame = currentFrame % currentAnim.frames;
        }
    }

    // 화면 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaledWidth = frameWidth * player.scale;
    const scaledHeight = frameHeight * player.scale;

    ctx.save();

    // 렌더링 할 이미지
    const imgToDraw = currentAnim.image;

    // 이미지가 아직 없거나 로드 전일 때는 시각적인 피드백만 제공
    if (imgToDraw.complete && imgToDraw.naturalWidth !== 0) {
        if (player.direction === -1) {
            // 원본 이미지의 너비를 기준으로, 한 줄에 몇 개의 프레임이 들어가는지 계산합니다.
            // (예: 128px 너비 이미지에 32px 프레임이면 한 줄에 4개)
            const columns = Math.floor(imgToDraw.naturalWidth / frameWidth);

            // 현재 프레임 번호를 이용해 그리드 상의 x, y 인덱스 계산
            const srcX = (currentFrame % columns) * frameWidth;
            const srcY = Math.floor(currentFrame / columns) * frameHeight;

            // 이미지 좌우 반전
            ctx.scale(-1, 1);
            ctx.drawImage(
                imgToDraw,
                srcX, srcY, frameWidth, frameHeight,
                -player.x - scaledWidth, player.y, scaledWidth, scaledHeight
            );
        } else {
            const columns = Math.floor(imgToDraw.naturalWidth / frameWidth);
            const srcX = (currentFrame % columns) * frameWidth;
            const srcY = Math.floor(currentFrame / columns) * frameHeight;

            // 기본 방향
            ctx.drawImage(
                imgToDraw,
                srcX, srcY, frameWidth, frameHeight,
                player.x, player.y, scaledWidth, scaledHeight
            );
        }
    } else {
        // 이미지가 존재하지 않을 때 그리는 임시 박스 (상태 텍스트 포함)
        ctx.fillStyle = player.direction === -1 ? 'indianred' : 'steelblue';
        ctx.fillRect(player.x, player.y, scaledWidth, scaledHeight);

        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(player.currentState, player.x + 10, player.y + 40);
        ctx.font = '12px Arial';
        ctx.fillText('NO IMAGE', player.x + 10, player.y + 60);
    }

    ctx.restore();

    requestAnimationFrame(draw);
}

// 게임 루프 시작
requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    draw(timestamp);
});
