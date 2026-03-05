let number = [
    { id: 1, img: "./images/1.png" },
    { id: 2, img: "./images/2.png" },
    { id: 3, img: "./images/3.png" },
    { id: 4, img: "./images/4.png" },
    { id: 5, img: "./images/5.png" },
    { id: 6, img: "./images/6.png" },
    { id: 7, img: "./images/7.png" },
    { id: 8, img: "./images/8.png" },
    { id: 9, img: "./images/9.png" },
    //{ id: 0, img: "./images/0.png" },
]

let type = [
    { id: 1, img: "./images/green.png" },
    { id: 2, img: "./images/heart.png" },
    { id: 3, img: "./images/ice.png" },
    //{ id: 4, img: "./images/purple.png" },
    { id: 4, img: "./images/star.png" }
]

// 자바스크립트 기본 객체(Object)와 충돌을 피하기 위해 이름을 Item으로 수정합니다.
function Item(scoreId, typeId) {
    // 1. 숫자
    this.score = scoreId;

    // 2. 숫자에 대응하는 이미지 (number 배열에서 찾기)
    let numObj = number.find(n => n.id === scoreId);
    this.scoreImage = numObj ? numObj.img : null;

    // 3. 속성
    this.type = typeId;

    // 4. 속성에 대응하는 이미지 (type 배열에서 찾기)
    let typeObj = type.find(t => t.id === typeId);
    this.typeImage = typeObj ? typeObj.img : null;
}



