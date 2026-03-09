// 퍼즐 아이템 부모 클래스
class PuzzleItem {
    constructor(name, itemId, color, level) {
        this.name = name;
        this.itemId = itemId;
        this.color = color;
        this.level = level;
        // 레벨에 따라 크기가 커짐 (수박 게임 스타일)
        this.size = 25 + (level * 10);
    }
}

// 아이템 목록 정의 (레벨 순서대로)
const itemDefinitions = [
    new PuzzleItem("빨간 네모", "level_1", "#ff5f5f", 1),
    new PuzzleItem("파란 네모", "level_2", "#5fafff", 2),
    new PuzzleItem("초록 네모", "level_3", "#5fffaf", 3),
    new PuzzleItem("노란 네모", "level_4", "#ffff5f", 4),
    new PuzzleItem("보라 네모", "level_5", "#af5fff", 5),
    new PuzzleItem("주황 네모", "level_6", "#ffaf5f", 6),
    new PuzzleItem("핑크 네모", "level_7", "#ff5faf", 7),
    new PuzzleItem("하늘 네모", "level_8", "#5fffff", 8)
];

// 다음 단계의 아이템 정의를 가져오는 함수
function getNextItemDefinition(currentLevel) {
    return itemDefinitions.find(def => def.level === currentLevel + 1);
}
