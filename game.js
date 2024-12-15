const EDITOR = false;
let waypoints = [];
let selectedWaypoint = null;

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: "game",

    backgroundColor: "#f0f0f0",
    physics: {
        default: "arcade",
        arcade: {
            debug: false,
        },
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
    },
};

const game = new Phaser.Game(config);
let car;
let route;
let scene;
let gameCreatedCallback;

function preload() {
    this.load.image("car", "assets/car.png");
    this.load.image("point", "assets/point.png");
    this.load.image("indicator", "assets/indicator.png");
    this.load.image("roundabout", "assets/roundabout.png");
}

function resetGame() {
    car.reset();
    route.reset();
    showScoreModal(0);
}

function setRoute(routeWaypoints) {

    if (route) {
        route.destroy();
    }

    route = new Route(
        scene,
        routeWaypoints,
        car
    );
}

function create() {

    scene = this;

    const roundabout = new RoundaboutImage(
        this,
        400,
        300,
        "roundabout",
        0.5
    );

    car = new Car(this, 355, 550, "car", (scale = 0.07));

    this.input.keyboard.on("keydown-SPACE", () => {
        resetGame();
    });

    if (EDITOR) {
        this.input.on("pointerdown", (pointer) => {
            if (selectedWaypoint) {

            } else {
                const waypoint = this.add
                    .circle(
                        pointer.x,
                        pointer.y,
                        5,
                        IndicatorStateColors[IndicatorState.OFF]
                    )
                    .setInteractive();
                waypoint.expectedState = IndicatorState.OFF;
                waypoint.on("pointerdown", () => {
                    // Toggle through the states and change the color
                    if (waypoint.expectedState === IndicatorState.OFF) {
                        waypoint.expectedState = IndicatorState.LEFT;
                        waypoint.setFillStyle(
                            IndicatorStateColors[IndicatorState.LEFT]
                        );
                    } else if (waypoint.expectedState === IndicatorState.LEFT) {
                        waypoint.expectedState = IndicatorState.RIGHT;
                        waypoint.setFillStyle(
                            IndicatorStateColors[IndicatorState.RIGHT]
                        );
                    } else {
                        waypoint.expectedState = IndicatorState.OFF;
                        waypoint.setFillStyle(
                            IndicatorStateColors[IndicatorState.OFF]
                        );
                    }
                    selectedWaypoint = waypoint;
                });
                waypoints.push(waypoint);
            }
        });

        this.input.keyboard.on("keydown-D", () => {
            if (selectedWaypoint) {
                selectedWaypoint.destroy();
                waypoints = waypoints.filter(
                    (waypoint) => waypoint !== selectedWaypoint
                );
                selectedWaypoint = null;
            }
        });

        this.input.keyboard.on("keydown-S", () => {
            const routeConfig = waypoints.map((waypoint) => [
                waypoint.x,
                waypoint.y,
                [waypoint.expectedState],
            ]);
            console.log("Route Config:", JSON.stringify(routeConfig));
        });
    }
    gameCreatedCallback();
}

function update() {
    if (!car) return;
    car.update();
}

function showScoreModal(score) {
    const scoreModal = document.getElementById("score-modal");
    scoreModal.style.display = "block";

    const scores = document.getElementById("scores");
    scores.innerHTML = `Score: ${score}%`;
}

const colors = {
    RED: 0xff0000,
    GREEN: 0x00ff00,
    BLUE: 0x0000ff,
    YELLOW: 0xffff00,
    BLACK: 0x000000,
    WHITE: 0xffffff,
};

const IndicatorState = {
    OFF: "off",
    LEFT: "left",
    RIGHT: "right",
};

const IndicatorStateColors = {
    [IndicatorState.LEFT]: colors.BLUE,
    [IndicatorState.RIGHT]: colors.RED,
    [IndicatorState.OFF]: colors.GREEN,
};

class Car {
    maxSpeed = 2;
    acceleration = 0.05;
    deceleration = 0.01;
    brakingPower = 0.1;
    turningSpeed = 0.1;
    turningDamper = 0.05;
    maxTurningAngle = 3;
    minTurningAngle = -3;

    constructor(scene, x, y, texture, scale) {
        this.scene = scene;
        this.cursors = scene.input.keyboard.createCursorKeys();

        scene.input.keyboard.on(
            "keydown-Z",
            this.toggleLeftIndicator.bind(this)
        );
        scene.input.keyboard.on(
            "keydown-X",
            this.toggleRightIndicator.bind(this)
        );

        this.startPosition = { x, y };

        this.container = scene.add.container(x, y);

        this.sprite = scene.add.sprite(0, 0, texture).setScale(scale);
        this.scene.physics.world.enable(this.sprite);
        this.container.add(this.sprite);

        this.sprite.angle = 0;
        this.speed = 0;
        this.currentTurningAngle = 0;

        this.rightIndicatorOn = false;
        this.leftIndicatorOn = false;
        this.indicatorState = IndicatorState.OFF;
        this.controlsEnabled = true;

        this.indicatorTimer = setInterval(
            this.blinkIndicators.bind(this),
            500
        );

        this.leftIndicators = scene.add.container(0, 0).setVisible(false);
        this.rightIndicators = scene.add.container(0, 0).setVisible(false);

        this.frontLeftIndicator = scene.add
            .sprite(-15, -30, "indicator")
            .setScale(0.1);

        this.backLeftIndicator = scene.add
            .sprite(-15, 30, "indicator")
            .setScale(0.1);

        this.leftIndicators.add(this.frontLeftIndicator);
        this.leftIndicators.add(this.backLeftIndicator);

        this.frontRightIndicator = scene.add
            .sprite(15, -30, "indicator")
            .setScale(0.1);

        this.backRightIndicator = scene.add
            .sprite(15, 30, "indicator")
            .setScale(0.1);

        this.rightIndicators.add(this.frontRightIndicator);
        this.rightIndicators.add(this.backRightIndicator);

        this.container.add(this.leftIndicators);
        this.container.add(this.rightIndicators);

        this.scene.physics.world.enable(this.container);
        this.container.body.setSize(this.sprite.width, this.sprite.height);
    }

    disableCarControls() {
        this.controlsEnabled = false;
    }

    enableCarControls() {
        this.controlsEnabled = true;
    }

    blinkIndicators() {
        if (this.rightIndicatorOn)
            this.rightIndicators.setVisible(!this.rightIndicators.visible);
        else this.rightIndicators.setVisible(false);

        if (this.leftIndicatorOn)
            this.leftIndicators.setVisible(!this.leftIndicators.visible);
        else this.leftIndicators.setVisible(false);
    }

    reset() {
        this.container.x = this.startPosition.x;
        this.container.y = this.startPosition.y;
        this.container.angle = 0;
        this.speed = 0;
        this.currentTurningAngle = 0;
        this.leftIndicatorOn = false;
        this.rightIndicatorOn = false;
        this.indicatorState = IndicatorState.OFF;
    }

    update() {
        // Handle acceleration
        if (this.cursors.up.isDown && this.controlsEnabled) {
            this.speed = Math.min(
                this.maxSpeed,
                this.speed + this.acceleration
            );
        } else {
            this.speed = Math.max(0, this.speed - this.deceleration);
        }
        // Handle braking
        if (this.cursors.down.isDown || !this.controlsEnabled) {
            this.speed = Math.max(0, this.speed - this.brakingPower);
        }

        // Apply movement with current speed
        if (this.speed > 0) {
            const rad = Phaser.Math.DegToRad(this.container.angle - 90);
            this.container.x += Math.cos(rad) * this.speed;
            this.container.y += Math.sin(rad) * this.speed;
        }

        // Handle turning
        if (this.cursors.left.isDown) {
            this.currentTurningAngle = Math.max(
                this.minTurningAngle,
                this.currentTurningAngle - this.turningSpeed
            );
        } else if (this.cursors.right.isDown) {
            this.currentTurningAngle = Math.min(
                this.maxTurningAngle,
                this.currentTurningAngle + this.turningSpeed
            );
        } else {
            if (this.currentTurningAngle > 0) {
                this.currentTurningAngle = Math.max(
                    0,
                    this.currentTurningAngle - this.turningDamper
                );
            } else if (this.currentTurningAngle < 0) {
                this.currentTurningAngle = Math.min(
                    0,
                    this.currentTurningAngle + this.turningDamper
                );
            }
        }
        this.container.angle +=
            this.currentTurningAngle * (this.speed / this.maxSpeed);
    }

    // setRightIndicator(visible) {
    //   this.rightIndicatorOn = visible;
    // }
    // setLeftIndicator(visible) {
    //   this.leftIndicatorOn = visible;
    // }

    toggleRightIndicator() {
        console.log("toggleRightIndicator ");
        if (this.leftIndicatorOn) {
            this.leftIndicatorOn = false;
        }
        this.rightIndicatorOn = !this.rightIndicatorOn;

        if (this.rightIndicatorOn) {
            this.indicatorState = IndicatorState.RIGHT;
        } else {
            this.indicatorState = IndicatorState.OFF;
        }
    }

    toggleLeftIndicator() {
        console.log("toggleLeftIndicator ");
        if (this.rightIndicatorOn) {
            this.rightIndicatorOn = false;
        }
        this.leftIndicatorOn = !this.leftIndicatorOn;

        if (this.leftIndicatorOn) {
            this.indicatorState = IndicatorState.LEFT;
        } else {
            this.indicatorState = IndicatorState.OFF;
        }
    }
}

class RoundaboutImage {
    constructor(scene, x, y, texture, scale) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.sprite = scene.add.sprite(x, y, texture).setScale(scale);
    }
}

class Waypoint {
    constructor(scene, x, y, car) {
        this.scene = scene;
        this.circle = scene.add.circle(x, y, 10, 0x0000ff);
        this.scene.physics.add.existing(this.circle);
        this.circle.body.setImmovable(true);

        this.expectedCarStatesWhenEntered = [];
        this.carStateWhenEntered = null;

        this.onCollideCallback = null;

        scene.physics.add.overlap(car.sprite, this.circle, () => {
            this.onCollide();
        });
    }

    setColor(color) {
        this.circle.fillColor = color;
    }

    setVisible(visible) {
        this.circle.visible = visible;
    }

    setExpectedCarStatesWhenEntered(expectedCarStatesWhenEntered) {
        this.expectedCarStatesWhenEntered = expectedCarStatesWhenEntered;
    }

    carHitWaypointWithCorrectState() {
        if (this.carStateWhenEntered == null) return false;

        for (let i = 0; i < this.expectedCarStatesWhenEntered.length; i++) {
            console.log(
                "this.expectedCarStatesWhenEntered[i]",
                this.expectedCarStatesWhenEntered[i]
            );

            if (
                this.expectedCarStatesWhenEntered[i] ===
                this.carStateWhenEntered.indicatorState
            ) {
                return true;
            }
        }

        return false;
    }

    onCollide() {
        console.log("Collided!");
        // this.circle.visible = false;

        if (this.carStateWhenEntered == null) {
            // collected car speed and indicator state
            this.carStateWhenEntered = {
                speed: car.speed,
                indicatorState: car.indicatorState,
            };
            console.log("carStateWhenEntered", this.carStateWhenEntered);

            if (this.onCollideCallback) {
                this.onCollideCallback();
            }
        }
    }

    reset() {
        this.carStateWhenEntered = null;
        this.circle.visible = false;
    }

    destroy() {
        this.circle.destroy();
    }
}

class Route {
    constructor(scene, waypointCoordinates, car) {
        this.scene = scene;
        this.car = car;
        this.waypointCoordinates = waypointCoordinates;
        this.waypoints = [];
        this.createWaypoints();

        this.setWaypointColors();
        this.lastWaypoint = this.getLastWaypoint();
        this.lastWaypoint.setColor(colors.GREEN);
        this.lastWaypoint.setVisible(true);

        this.lastWaypoint.onCollideCallback = () => {
            console.log("🏁 lastWaypointReached");
            // this.reset();
            this.showWaypoints();
            this.setWaypointColorsForCarEnteredStateCorrect();
            car.disableCarControls();
            const score = this.calculateScorePercentage();
            showScoreModal(score);
        };
    }

    calculateScorePercentage() {
        let score = 0;
        for (let i = 0; i < this.waypoints.length; i++) {
            if (this.waypoints[i].carHitWaypointWithCorrectState()) {
                score++;
            }
        }
        return Math.round((score / this.waypoints.length) * 100);
    }

    createWaypoints() {
        for (let i = 0; i < this.waypointCoordinates.length; i++) {
            const newWaypoint = new Waypoint(
                this.scene,
                this.waypointCoordinates[i][0],
                this.waypointCoordinates[i][1],
                this.car
            );
            newWaypoint.setExpectedCarStatesWhenEntered(
                this.waypointCoordinates[i][2]
            );
            newWaypoint.setVisible(false);
            this.waypoints.push(newWaypoint);
        }
    }

    setWaypointColorsForCarEnteredStateCorrect() {
        for (let i = 0; i < this.waypoints.length; i++) {
            if (this.waypoints[i].carHitWaypointWithCorrectState()) {
                this.waypoints[i].setColor(colors.GREEN);
            } else {
                this.waypoints[i].setColor(colors.RED);
            }
        }
    }

    setWaypointColors() {
        for (let i = 0; i < this.waypoints.length; i++) {
            this.waypoints[i].setColor(colors.RED);
        }
    }

    showWaypoints() {
        for (let i = 0; i < this.waypoints.length; i++) {
            this.waypoints[i].setVisible(true);
        }
    }

    getLastWaypoint() {
        return this.waypoints[this.waypoints.length - 1];
    }

    reset() {
        for (let i = 0; i < this.waypoints.length; i++) {
            this.waypoints[i].reset();
        }
        this.lastWaypoint.setColor(colors.GREEN);
        this.lastWaypoint.setVisible(true);
        this.car.enableCarControls();
    }

    destroy() {
        for (let i = 0; i < this.waypoints.length; i++) {
            this.waypoints[i].destroy();
        }
    }
}

console.log("loaded game.js");
