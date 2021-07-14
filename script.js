const canvas = document.querySelector('canvas');
const scoreDisplay = document.querySelector('[data-score]')
const pointDisplay = document.querySelector('[data-points]')
const startGame = document.querySelector('[data-start-game]')
const scoreBoard = document.querySelector('[data-score-board]')

canvas.width = innerWidth;
canvas.height = innerHeight;

//Get context

var c = canvas.getContext('2d');

//Update canvas size 

addEventListener('resize', () => {
    canvas.width = innerWidth
    canvas.height = innerHeight
})

// Create an array to store projectiles, an array to store enemies, and a variable to store score

let projectiles;
let enemies;
let score;

function init() {

    projectiles = [];
    enemies = [];
    score = 0;
    scoreDisplay.innerHTML = 0;

}

// Create projectile class

class Projectile {
    constructor(radius, color, velocity) {
        this.x = canvas.width/2;
        this.y = canvas.height/2;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI*2, false)
        c.fillStyle = this.color;
        c.fill();
    }
    update() {
        this.draw();
        this.x += this.velocity.x
        this.y += this.velocity.y
    }
}

// Create click event to shoot projectiles

addEventListener('click', event => {
    const angle = Math.atan2(event.clientY - innerHeight/2,  event.clientX - innerWidth/2);
    const velocity = {
        x: 4*Math.cos(angle),
        y: 4*Math.sin(angle)
    }
    projectiles.push( new Projectile( 8, "white", velocity) )
})

//Create player

class Player {
    constructor(radius, color) {
        this.radius = radius;
        this.color = color;
    }
    draw(x, y) {
        this.x = x;
        this.y = y;
        c.beginPath();
        c.arc(x, y, this.radius, 0, Math.PI*2, false )
        c.fillStyle = this.color;
        c.fill();
    }
}

var player = new Player(20, "white");

// Create enemies

class Enemy {
    constructor(x, y, velocity, color ) {
        this.x = x;
        this.y = y;
        this.radius = Math.random()*20 + 6;
        this.velocity = velocity;
        this.color = color;
    }
    
    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI*2, false );
        c.fillStyle = this.color
        c.fill();
    }

    update() {
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}

// Create an array to store particles

var particles = [];

// Create particle class

class Particle {
    constructor(x, y, radius, color, velocity ) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.friction = 0.99;
        this.alpha = 1;
    }
    draw() {
        c.save();
        c.globalAlpha = this.alpha;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        c.fillStyle = this.color;
        c.fill();
        c.restore();
    }
    update() {
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        this.alpha -= 0.01;
    }
}

// Create a function to spawn enemies every 1000 ms

setInterval(() => {
    let x;
    let y;
    const spawnDist = 100;
    if ( Math.random() > 0.5 ) {
        x = (Math.random() > 0.5) ? 0 - spawnDist : canvas.width + spawnDist;
        y = Math.random()*innerHeight;
    } else {
        y = (Math.random() > 0.5) ? 0 - spawnDist : canvas.height + spawnDist;
        x = Math.random()*innerWidth;
    }
    const angle = Math.atan2(canvas.height/2 - y, canvas.width/2 - x );
    const velocity = {
        x: Math.cos(angle),
        y: Math.sin(angle)
    }
    const color = `hsl(${Math.random()*360}, 80%, 70%)`
    enemies.push( new Enemy(x, y, velocity, color) )
}, 1000)

// Create animate function

var animationFrameId, distToPlayer, distToProjectile

function animate() {
    animationFrameId = requestAnimationFrame(animate)
    c.fillStyle = "rgba(0, 0, 0, 0.1)"
    c.fillRect(0, 0, canvas.width, canvas.height)
    // Draw player on each frame
    player.draw(canvas.width/2, canvas.height/2)
    // Update projectiles' positions
    projectiles.forEach( (projectile, index) => {
        projectile.update()
        // Destroy a projectile if it is out of the screen
        if ( projectile.x + projectile.radius < 0 || 
            projectile.x - projectile.radius > canvas.width ||
            projectile.y - projectile.radius < 0 ||
            projectile.y + projectile.radius > canvas.height ) {
                projectiles.splice(index, 1);
            }
    })
    // Create explosion 
    particles.forEach( (particle, index) => {
        if ( particle.alpha <= 0 ) particles.splice(index, 1);
        else particle.update();
    } )
    // Update enemies' positions
    enemies.forEach( (enemy, index) => {
        enemy.update();
        // End game if there is an enemy colliding with the player
        distToPlayer = Math.hypot( enemy.x - player.x, enemy.y - player.y );
        if ( distToPlayer <= player.radius + enemy.radius ) {
            cancelAnimationFrame(animationFrameId)
            pointDisplay.innerHTML = score;
            scoreBoard.style.display = 'block';
        }
        // Destroy the enemy that is hit by the projectile
        projectiles.forEach( (projectile, i) => {
            distToProjectile = Math.hypot( enemy.x - projectile.x, enemy.y - projectile.y );
            if ( distToProjectile <= enemy.radius + projectile.radius ) {
                // Remove projectile from screen
                projectiles.splice(i, 1);
                // Create particles for the explosion
                for ( let i = 0; i < enemy.radius*2; i ++ ) {
                    particles.push(new Particle(enemy.x, enemy.y, Math.random() + 1, enemy.color, {
                        x: (Math.random() - 0.5)*(Math.random()*3 + 5),
                        y: (Math.random() - 0.5)*(Math.random()*3 + 5)
                    }));
                }
                // Shrink if radius >= 13, otherwise destroy
                if ( enemy.radius > 13 ) {
                    gsap.to(enemy, {
                        radius: enemy.radius - 8
                    })
                    score += 100;
                } else {
                    enemies.splice(index, 1);
                    score += 200;
                }
                scoreDisplay.innerHTML = score;
            }
        })
    })
}

// Create function for the start button

startGame.addEventListener('click', () => {

    scoreBoard.style.display = 'none';
    init();
    animate();

})
