const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Events } = Matter;

// 엔진 생성 (정밀도 대폭 향상: position/velocity iterations 증가)
const engine = Engine.create({
    positionIterations: 30,
    velocityIterations: 30
});

// 렌더러 생성
const render = Render.create({
    element: document.getElementById('game'),
    engine: engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: 'transparent'
    }
});

Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

// 마우스 제어 추가 (stiffness를 낮춰 벽을 뚫고 당겨지는 현상 완화)
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        stiffness: 0.1,
        render: {
            visible: false
        }
    }
});

Composite.add(engine.world, mouseConstraint);

// 마우스 드래그 중인 오브젝트 추적
let draggedBody = null;

Events.on(mouseConstraint, 'startdrag', (event) => {
    draggedBody = event.body;
});

Events.on(mouseConstraint, 'enddrag', () => {
    draggedBody = null;
});

// 물리 업데이트 전 처리
Events.on(engine, 'beforeUpdate', () => {
    // 1. 드래그 중인 물체의 중력을 상쇄
    if (draggedBody && !draggedBody.isStatic) {
        const gravity = engine.gravity;
        Matter.Body.applyForce(draggedBody, draggedBody.position, {
            x: -gravity.x * gravity.scale * draggedBody.mass,
            y: -gravity.y * gravity.scale * draggedBody.mass
        });
    }

    // 2. 모든 물체의 최대 속도 제한 (터널링 방지 핵심)
    const bodies = Composite.allBodies(engine.world);
    const maxSpeed = 15;
    bodies.forEach(body => {
        if (!body.isStatic && body.speed > maxSpeed) {
            const ratio = maxSpeed / body.speed;
            Matter.Body.setVelocity(body, {
                x: body.velocity.x * ratio,
                y: body.velocity.y * ratio
            });
        }
    });
});

// 바닥 및 벽 (경계선)
// 물리적 두께는 500으로 아주 두껍게 설정하여 터널링 완벽 차단
const wallThickness = 500;
const visualThickness = 4;
const physicsOptions = { isStatic: true, render: { visible: false } };
const visualOptions = { isStatic: true, isSensor: true, render: { fillStyle: 'black' } };
console.log(`Initializing walls with physics thickness: ${wallThickness}`);

// 물리 전용 벽 (보이지 않음)
const groundPhys = Bodies.rectangle(window.innerWidth / 2, window.innerHeight - 100 + wallThickness / 2, window.innerWidth, wallThickness, physicsOptions);
const leftWallPhys = Bodies.rectangle(-wallThickness / 2, window.innerHeight / 2, wallThickness, window.innerHeight, physicsOptions);
const rightWallPhys = Bodies.rectangle(window.innerWidth + wallThickness / 2, window.innerHeight / 2, wallThickness, window.innerHeight, physicsOptions);

// 시각 전용 선 (충돌하지 않음)
const groundVis = Bodies.rectangle(window.innerWidth / 2, window.innerHeight - 100, window.innerWidth, visualThickness, visualOptions);
const leftWallVis = Bodies.rectangle(visualThickness / 2, window.innerHeight / 2, visualThickness, window.innerHeight, visualOptions);
const rightWallVis = Bodies.rectangle(window.innerWidth - visualThickness / 2, window.innerHeight / 2, visualThickness, window.innerHeight, visualOptions);

Composite.add(engine.world, [groundPhys, leftWallPhys, rightWallPhys, groundVis, leftWallVis, rightWallVis]);

const centerbtn = document.getElementById("centerBtn");
const spawnbtn_10 = document.getElementById("spawnBtn_10");

// 오브젝트 생성 함수 (코드 중복 방지)
function createPuzzleBody(x, y, definition) {
    const box = Bodies.rectangle(x, y, definition.size, definition.size, {
        render: { fillStyle: definition.color },
        label: definition.name,
        friction: 0.05,
        restitution: 0.3,
        frictionAir: 0.02 // 공기 저항 추가 (기본값 0.01)
    });

    box.plugin = {
        name: definition.name,
        itemId: definition.itemId,
        level: definition.level
    };

    return box;
}

centerbtn.addEventListener("click", () => {
    // 처음에 소환되는 아이템은 낮은 레벨 위주로 (1~3단계)
    const spawnableIndices = [0, 1, 2];
    const randomIndex = spawnableIndices[Math.floor(Math.random() * spawnableIndices.length)];
    const randomDef = itemDefinitions[randomIndex];

    const box = createPuzzleBody(window.innerWidth / 2, 100, randomDef);
    Composite.add(engine.world, box);
});

spawnbtn_10.addEventListener("click", () => {
    // 처음에 소환되는 아이템은 낮은 레벨 위주로 (1~3단계)
    for (let i = 0; i < 10; i++) {
        const spawnableIndices = [0, 1, 2];
        const randomIndex = spawnableIndices[Math.floor(Math.random() * spawnableIndices.length)];
        const randomDef = itemDefinitions[randomIndex];

        const box = createPuzzleBody(window.innerWidth / 2, 100, randomDef);
        Composite.add(engine.world, box);
    }
});

// 합성(Merge) 로직 처리
Events.on(engine, 'collisionStart', (event) => {
    const pairs = event.pairs;

    pairs.forEach((pair) => {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        // 둘 다 고정된 물체(바닥 등)가 아니고, 같은 itemId(레벨)를 가지고 있는지 확인
        if (!bodyA.isStatic && !bodyB.isStatic &&
            bodyA.plugin && bodyB.plugin &&
            bodyA.plugin.level === bodyB.plugin.level) {

            // 이미 제거 대상인 경우 건너뜀 (중복 처리 방지)
            if (bodyA.isMarkedForRemoval || bodyB.isMarkedForRemoval) return;

            const currentLevel = bodyA.plugin.level;
            const nextDef = getNextItemDefinition(currentLevel);

            if (nextDef) {
                // 제거 마킹
                bodyA.isMarkedForRemoval = true;
                bodyB.isMarkedForRemoval = true;

                // 합성 지점 계산 (중점)
                const midX = (bodyA.position.x + bodyB.position.x) / 2;
                const midY = (bodyA.position.y + bodyB.position.y) / 2;

                // 다음 프레임에서 제거 및 생성 (물리 엔진 연산 중 변경 방지)
                setTimeout(() => {
                    Composite.remove(engine.world, [bodyA, bodyB]);

                    const newBox = createPuzzleBody(midX, midY, nextDef);
                    Composite.add(engine.world, newBox);
                }, 0);
            }
        }
    });
});

// 창 크기 조절 대응
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    render.canvas.width = width;
    render.canvas.height = height;

    // 물리 벽 위치/크기 업데이트
    Matter.Body.setPosition(groundPhys, { x: width / 2, y: height - 100 + wallThickness / 2 });
    Matter.Body.setPosition(leftWallPhys, { x: -wallThickness / 2, y: height / 2 });
    Matter.Body.setPosition(rightWallPhys, { x: width + wallThickness / 2, y: height / 2 });

    Matter.Body.setVertices(groundPhys, Bodies.rectangle(width / 2, height - 100 + wallThickness / 2, width, wallThickness).vertices);
    Matter.Body.setVertices(leftWallPhys, Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height).vertices);
    Matter.Body.setVertices(rightWallPhys, Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height).vertices);

    // 시각 선 위치/크기 업데이트
    Matter.Body.setPosition(groundVis, { x: width / 2, y: height - 100 });
    Matter.Body.setPosition(leftWallVis, { x: visualThickness / 2, y: height / 2 });
    Matter.Body.setPosition(rightWallVis, { x: width - visualThickness / 2, y: height / 2 });

    Matter.Body.setVertices(groundVis, Bodies.rectangle(width / 2, height - 100, width, visualThickness).vertices);
    Matter.Body.setVertices(leftWallVis, Bodies.rectangle(visualThickness / 2, height / 2, visualThickness, height).vertices);
    Matter.Body.setVertices(rightWallVis, Bodies.rectangle(width - visualThickness / 2, height / 2, visualThickness, height).vertices);
});
