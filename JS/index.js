function initClockElements() {
    const clockFace = document.getElementById('clock-face');
    const radius = 50;

    for (let i = 0; i < 60; i++) {
        const mark = document.createElement('div');
        mark.classList.add('clock-mark');
        if (i % 5 === 0) mark.classList.add('major');
        mark.style.transform = `translateX(-50%) rotate(${i * 6}deg) translateY(-${radius - 8}px)`;
        clockFace.appendChild(mark);
    }

    for (let num = 1; num <= 12; num++) {
        const numberEl = document.createElement('div');
        numberEl.classList.add('clock-number');
        numberEl.textContent = num;
        const angle = (num * 30 - 90) * (Math.PI / 180);
        const x = radius + 36 * Math.cos(angle) - 7;
        const y = radius + 36 * Math.sin(angle) - 7;
        numberEl.style.left = `${x}px`;
        numberEl.style.top = `${y}px`;
        clockFace.appendChild(numberEl);
    }
}

function adjustRowHeights() {
    const rows = document.querySelectorAll('.timetable-row');
    rows.forEach(row => {
        const start = parseInt(row.getAttribute('data-start'));
        const end = parseInt(row.getAttribute('data-end'));
        const duration = end - start;
        
        const tds = row.querySelectorAll('td');
        tds.forEach(td => {
            td.style.height = `${duration * 1.2}px`;
        });
    });
}

function updateTimeLine() {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const timeLine = document.getElementById('time-line');
    const container = document.getElementById('timetable-container');
    const rows = document.querySelectorAll('.timetable-row');
    
    let isWithinSchoolTime = false;

    for (let row of rows) {
        const start = parseInt(row.getAttribute('data-start'));
        const end = parseInt(row.getAttribute('data-end'));
        
        if (currentMinutes >= start && currentMinutes <= end) {
            isWithinSchoolTime = true;
            
            const rowTop = row.offsetTop;
            const rowHeight = row.offsetHeight;
            const percentage = (currentMinutes - start) / (end - start);
            
            const lineY = rowTop + (rowHeight * percentage);
            timeLine.style.top = `${lineY}px`;
            timeLine.classList.remove('hidden');
            break;
        }
    }
    
    if (!isWithinSchoolTime) {
        timeLine.classList.add('hidden');
    }
}

function updateClock() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const hourDeg = (hours % 12) * 30 + minutes * 0.5;
    const minuteDeg = minutes * 6 + seconds * 0.1;
    const secondDeg = seconds * 6;

    document.getElementById('hour-hand').style.transform = `translateX(-50%) rotate(${hourDeg}deg)`;
    document.getElementById('minute-hand').style.transform = `translateX(-50%) rotate(${minuteDeg}deg)`;
    document.getElementById('second-hand').style.transform = `translateX(-50%) rotate(${secondDeg}deg)`;

    const hStr = String(hours).padStart(2, '0');
    const mStr = String(minutes).padStart(2, '0');
    const sStr = String(seconds).padStart(2, '0');

    document.getElementById('digital-clock').textContent = `${hStr}:${mStr}:${sStr}`;
}

// 실시간 급식 데이터 호출 함수
async function fetchSchoolMeal() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const ymd = `${year}${month}${date}`;

    const dateEl = document.getElementById('meal-date');
    if (dateEl) dateEl.textContent = `${year}-${month}-${date}`;

    const AUTH_KEY = "9b092ae280784b31b42b54c764436302"; 
    const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${AUTH_KEY}&Type=json&ATPT_OFCDC_SC_CODE=B10&SD_SCHUL_CODE=7011569&MLSV_YMD=${ymd}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        const breakfastEl = document.getElementById('meal-breakfast');
        const lunchEl = document.getElementById('meal-lunch');
        const dinnerEl = document.getElementById('meal-dinner');

        if (breakfastEl) breakfastEl.textContent = "급식 없음";
        if (lunchEl) lunchEl.textContent = "급식 없음";
        if (dinnerEl) dinnerEl.textContent = "급식 없음";

        if (data.mealServiceDietInfo) {
            const mealRows = data.mealServiceDietInfo[1].row;
            
            mealRows.forEach(item => {
                const cleanMeal = item.DDISH_NM
                    .replace(/<br\/>/g, '\n')
                    .replace(/\([0-9.]+\)/g, '')
                    .trim();
                
                if (item.MMEAL_SC_CODE === "1" && breakfastEl) {
                    breakfastEl.textContent = cleanMeal;
                } else if (item.MMEAL_SC_CODE === "2" && lunchEl) {
                    lunchEl.textContent = cleanMeal;
                } else if (item.MMEAL_SC_CODE === "3" && dinnerEl) {
                    dinnerEl.textContent = cleanMeal;
                }
            });
        } else {
            let errorMsg = "급식 정보가 없습니다.";
            if (data.RESULT && data.RESULT.MESSAGE) {
                if (data.RESULT.CODE !== "INFO-200") {
                    errorMsg = `${data.RESULT.MESSAGE}`;
                }
            }
            if (breakfastEl) breakfastEl.textContent = errorMsg;
            if (lunchEl) lunchEl.textContent = errorMsg;
            if (dinnerEl) dinnerEl.textContent = errorMsg;
        }
    } catch (error) {
        console.error("급식 데이터 가공 실패:", error);
        const errorMsg = "데이터를 불러올 수 없습니다.";
        if (document.getElementById('meal-breakfast')) document.getElementById('meal-breakfast').textContent = errorMsg;
        if (document.getElementById('meal-lunch')) document.getElementById('meal-lunch').textContent = errorMsg;
        if (document.getElementById('meal-dinner')) document.getElementById('meal-dinner').textContent = errorMsg;
    }
}

// 초기 로드 이벤트 처리기 (꼬여있던 종결 구문 교정 완료)
document.addEventListener('DOMContentLoaded', () => {
    initClockElements();
    adjustRowHeights();
    
    updateClock();
    updateTimeLine();
    
    setTimeout(fetchSchoolMeal, 50);
    
    setInterval(() => {
        updateClock();
        updateTimeLine();
    }, 1000);
});
