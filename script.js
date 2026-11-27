// Плавная прокрутка для внутренних ссылок и небольшой эффект появления карточек.
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', event => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

const revealItems = document.querySelectorAll('.rule-card, .event-card, .section-heading');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach(item => {
    item.classList.add('reveal');
    observer.observe(item);
  });
}

// Интерактивное колесо фортуны с добавлением участников.
(() => {
  const canvas = document.getElementById('fortuneWheel');
  const spinButton = document.getElementById('spinButton');
  if (!canvas || !spinButton) return;

  const ctx = canvas.getContext('2d');
  const hint = document.getElementById('wheelHint');
  const input = document.getElementById('participantInput');
  const addButton = document.getElementById('addParticipant');
  const list = document.getElementById('participantsList');
  const count = document.getElementById('participantsCount');
  const colors = ['#762d85', '#d34eaa', '#54256f', '#b83e91', '#71308d', '#df6ab8', '#4a205f', '#a83c88'];
  let participants = [];
  let currentRotation = 0;
  let spinning = false;

  const size = canvas.width;
  const center = size / 2;
  const radius = center - 10;

  function drawWheel() {
    ctx.clearRect(0, 0, size, size);
    if (!participants.length) {
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#54256f';
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#f5c987';
      ctx.stroke();
      ctx.fillStyle = '#fff5fb';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 28px Manrope, Arial, sans-serif';
      ctx.fillText('Добавь участников', center, center, radius * 1.5);
      return;
    }

    const slice = (Math.PI * 2) / participants.length;
    participants.forEach((person, index) => {
      const start = -Math.PI / 2 + index * slice;
      const end = start + slice;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#f5c987';
      ctx.stroke();

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(start + slice / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff5fb';
      ctx.shadowColor = '#240c32';
      ctx.shadowBlur = 5;
      const fontSize = Math.max(12, Math.min(25, 250 / participants.length));
      ctx.font = `bold ${fontSize}px Manrope, Arial, sans-serif`;
      ctx.fillText(person, radius - 34, 0, radius * .62);
      ctx.restore();

      const dotAngle = start + slice / 2;
      const dotX = center + Math.cos(dotAngle) * (radius - 9);
      const dotY = center + Math.sin(dotAngle) * (radius - 9);
      ctx.beginPath();
      ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffe6ad';
      ctx.fill();
    });
  }

  function updateParticipants() {
    list.replaceChildren();
    count.textContent = `Участников: ${participants.length}`;
    if (!participants.length) {
      const empty = document.createElement('li');
      empty.className = 'participants-empty';
      empty.textContent = 'Пока никого нет — добавь первого участника.';
      list.appendChild(empty);
    } else {
      participants.forEach((person, index) => {
        const item = document.createElement('li');
        item.className = 'participant-item';
        const name = document.createElement('span');
        name.textContent = person;
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'participant-remove';
        remove.textContent = '×';
        remove.setAttribute('aria-label', `Удалить участника ${person}`);
        remove.disabled = spinning;
        remove.addEventListener('click', () => {
          if (spinning) return;
          participants.splice(index, 1);
          updateParticipants();
        });
        item.append(name, remove);
        list.appendChild(item);
      });
    }
    spinButton.disabled = spinning || participants.length === 0;
    spinButton.querySelector('.button-label').textContent =
      participants.length ? 'Крутить колесо' : 'Добавь участников';
    drawWheel();
  }

  function addParticipant() {
    const name = input.value.trim();
    if (!name || spinning) {
      input.focus();
      return;
    }
    if (participants.some(person => person.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      hint.textContent = 'Такой участник уже есть в списке.';
      input.focus();
      return;
    }
    participants.push(name);
    input.value = '';
    hint.textContent = 'Участник добавлен. Можно запускать колесо!';
    updateParticipants();
    input.focus();
  }

  addButton.addEventListener('click', addParticipant);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') addParticipant();
  });

  const modal = document.createElement('div');
  modal.className = 'wheel-result';
  modal.innerHTML = '<div class="result-box" role="dialog" aria-modal="true" aria-labelledby="wheelResultTitle"><div class="result-sparkle">✧ ✦ ✧</div><h3 id="wheelResultTitle">Победитель!</h3><p id="wheelResultText"></p><button class="button button-primary result-close" type="button">Отлично!</button></div>';
  document.body.appendChild(modal);
  const resultText = modal.querySelector('#wheelResultText');
  const closeButton = modal.querySelector('.result-close');

  function closeModal() {
    modal.classList.remove('is-open');
  }
  closeButton.addEventListener('click', closeModal);
  modal.addEventListener('click', event => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeModal();
  });

  spinButton.addEventListener('click', () => {
    if (spinning || !participants.length) return;
    spinning = true;
    const winner = Math.floor(Math.random() * participants.length);
    const degreesPerSlice = 360 / participants.length;
    const targetWithinTurn = 360 - (winner * degreesPerSlice + degreesPerSlice / 2);
    const extraTurns = 6 + Math.floor(Math.random() * 3);
    const normalizedCurrent = ((currentRotation % 360) + 360) % 360;
    const delta = extraTurns * 360 + ((targetWithinTurn - normalizedCurrent + 360) % 360);
    currentRotation += delta;

    spinButton.disabled = true;
    spinButton.querySelector('.button-label').textContent = 'Колесо вращается...';
    addButton.disabled = true;
    input.disabled = true;
    list.querySelectorAll('button').forEach(button => button.disabled = true);
    hint.textContent = 'Колесо выбирает победителя…';
    canvas.style.transform = `rotate(${currentRotation}deg)`;

    window.setTimeout(() => {
      spinning = false;
      addButton.disabled = false;
      input.disabled = false;
      updateParticipants();
      hint.textContent = `Победитель выбран: ${participants[winner]}!`;
      resultText.textContent = `Поздравляем, ${participants[winner]}! Колесо фортуны выбрало именно тебя.`;
      modal.classList.add('is-open');
    }, 6000);
  });

  drawWheel();
  updateParticipants();
})();
