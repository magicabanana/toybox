const GRID_WIDTH = 7;
const GRID_HEIGHT = 7;

// DOM 요소 캐싱
let gridElement;

// 2차원 배열 (행렬) - null로 초기화하여 빈 칸을 표시
const objArr = Array.from({ length: GRID_HEIGHT }, () =>
    Array.from({ length: GRID_WIDTH }, () => null)
);

function initGrid() {
    gridElement = document.getElementById('grid');
    if (!gridElement) return;

    // CSS Grid 템플릿 설정 (스타일에 의존하는 값 대신 직접 설정하여 견고하게)
    gridElement.style.gridTemplateColumns = `repeat(${GRID_WIDTH}, var(--cell-size))`;
    gridElement.style.gridTemplateRows = `repeat(${GRID_HEIGHT}, var(--cell-size))`;

    // 배경 셀 생성
    for (let r = 0; r < GRID_HEIGHT; r++) {
        for (let c = 0; c < GRID_WIDTH; c++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            gridElement.appendChild(cell);
        }
    }
}

function getRandomItem() {
    // number와 type 배열은 object.js에 전역 선언되어 있음
    const rndScore = number[Math.floor(Math.random() * number.length)].id;
    const rndType = type[Math.floor(Math.random() * type.length)].id;
    return new Item(rndScore, rndType);
}

function applyGravity() {
    // 1. 빈 공간 위로 쌓인 기존 오브젝트들을 밑으로 떨어뜨리기
    for (let c = 0; c < GRID_WIDTH; c++) {
        // 각 열의 맨 아래 칸부터 위로 탐색
        for (let r = GRID_HEIGHT - 1; r >= 0; r--) {
            // 현재 칸이 비어있는 곳을 찾았다면
            if (objArr[r][c] === null) {
                // 그 칸보다 위에 있는 오브젝트를 찾아서 끌어내림
                for (let k = r - 1; k >= 0; k--) {
                    if (objArr[k][c] !== null) {
                        // 배열 데이터 교체
                        objArr[r][c] = objArr[k][c];
                        objArr[k][c] = null;

                        // DOM 요소 업데이트
                        const itemWrapper = gridElement.querySelector(`.item-wrapper[data-row="${k}"][data-col="${c}"]`);
                        if (itemWrapper) {
                            // 데이터 속성도 새 위치로 갱신 (inputManager 연동)
                            itemWrapper.dataset.row = r;

                            // 새 위치로 이동하는 애니메이션 적용
                            const cellSize = 60;
                            const gap = 5;
                            const finalTopPos = r * (cellSize + gap) + gap;

                            requestAnimationFrame(() => {
                                itemWrapper.style.top = `${finalTopPos}px`;
                            });
                        }
                        break; // 하나 내렸으면 다음 빈 r (루프 계속)
                    }
                }
            }
        }
    }
}

function fillEmptySpaces() {
    let delayIndex = 0;
    const cellSize = 60;
    const gap = 5;

    // 2. 배열 상단에 비어있는 공간 부분에 새로운 오브젝트를 채우기
    for (let c = 0; c < GRID_WIDTH; c++) {
        let emptyCount = 0; // 이 열의 위쪽 빈칸 누적 갯수
        for (let r = GRID_HEIGHT - 1; r >= 0; r--) {
            if (objArr[r][c] === null) {
                emptyCount++;

                const newItem = getRandomItem();
                objArr[r][c] = newItem;

                // DOM 요소 생성
                const itemWrapper = document.createElement('div');
                itemWrapper.classList.add('item-wrapper');
                itemWrapper.dataset.row = r;
                itemWrapper.dataset.col = c;

                const typeImgUrl = newItem.typeImage || './images/heart.png';
                const typeImgElem = document.createElement('img');
                typeImgElem.src = typeImgUrl;
                typeImgElem.classList.add('item-type-img');

                const scoreImgUrl = newItem.scoreImage || './images/1.png';
                const scoreImgElem = document.createElement('img');
                scoreImgElem.src = scoreImgUrl;
                scoreImgElem.classList.add('item-score-img');

                itemWrapper.appendChild(typeImgElem);
                itemWrapper.appendChild(scoreImgElem);

                const leftPos = c * (cellSize + gap) + gap;
                // 완전히 화면 위 보이지 않는 곳에서 낙하시작
                const startTopPos = -(emptyCount * (cellSize + gap)) - 100;
                const finalTopPos = r * (cellSize + gap) + gap;

                itemWrapper.style.left = `${leftPos}px`;
                itemWrapper.style.top = `${startTopPos}px`;

                gridElement.appendChild(itemWrapper);

                // 시차 애니메이션
                setTimeout(() => {
                    requestAnimationFrame(() => {
                        itemWrapper.style.top = `${finalTopPos}px`;
                    });
                }, delayIndex * 35);

                delayIndex++;
            }
        }
    }
}

// 외부 기능(버튼 등)에서 부를 랜덤 채우기 트리거
function addRandomObject() {
    if (!gridElement) return;

    // 혹시라도 공중에 뜬 게 있으면 중력 먼저 부여
    applyGravity();

    // 약간의 딜레이 후 채워 넣음
    setTimeout(() => {
        fillEmptySpaces();
    }, 10);
}

function clearAllObjects() {
    // 데이터 2차원 배열 초기화 (모두 null로)
    for (let r = 0; r < GRID_HEIGHT; r++) {
        for (let c = 0; c < GRID_WIDTH; c++) {
            objArr[r][c] = null;
        }
    }

    // DOM에서 아이템 래퍼만 제거
    const items = document.querySelectorAll('.item-wrapper');
    items.forEach(item => item.remove());
}

// 특정 아이템 배열(DOM 요소 배열)을 받아 삭제하고 새로운 오브젝트를 위에서 떨어뜨리는 함수
function removeItems(itemsToRemove) {
    if (!itemsToRemove || itemsToRemove.length === 0) return;

    const animations = itemsToRemove.map(itemEl => {

        const row = parseInt(itemEl.dataset.row);
        const col = parseInt(itemEl.dataset.col);

        // 1. 데이터 먼저 제거
        objArr[row][col] = null;

        // 2. 랜덤 X 방향 추가 (게임 느낌)
        const randomX = (Math.random() - 0.5) * 150;

        // 3. 포물선 애니메이션 실행 (Promise 반환)
        return parabolaDrop(itemEl, 700, randomX, 500);
    });

    // 4. 전부 끝난 뒤 중력 실행
    Promise.all(animations).then(() => {
        applyGravity();
        fillEmptySpaces();
    });
}
function parabolaDrop(element, duration = 1500, distanceX = 0, dropDistance = 500, jumpPower = 300) {
    return new Promise(resolve => {

        const start = performance.now();

        const gravity = (2 * (dropDistance + jumpPower)) / (duration * duration);
        const initialVelocityY = -Math.sqrt(2 * gravity * jumpPower);
        const velocityX = distanceX / duration;

        function animate(now) {
            const elapsed = now - start;

            if (elapsed >= duration) {
                element.style.transform =
                    `translate(${distanceX}px, ${dropDistance}px)`;
                element.style.opacity = 0;
                element.remove();
                resolve();
                return;
            }

            const x = velocityX * elapsed;
            const y = initialVelocityY * elapsed + 0.5 * gravity * elapsed * elapsed;

            element.style.transform = `translate(${x}px, ${y}px)`;
            element.style.opacity = 1 - (elapsed / duration);

            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
    });
}

// 점수 추가 및 UI 업데이트 (gameManager.js의 전역 변수 totalScore 활용)
function addScore(scoreToAdd) {
    if (typeof totalScore !== 'undefined') {
        totalScore += scoreToAdd;
        console.log(`점수 추가됨: +${scoreToAdd} ➡️ 현재 총점: ${totalScore}`);

        // UI 엘리먼트 업데이트
        const scoreUI = document.getElementById('global-total-score');
        if (scoreUI) {
            scoreUI.innerText = totalScore;
        }
    }
}

function GridManager() {
    initGrid();

    // 외부에서 호출할 메서드 노출
    return {
        addRandomObject,
        clearAllObjects,
        removeItems,
        addScore
    }
}