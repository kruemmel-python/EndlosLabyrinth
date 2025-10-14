// Maze generation and analysis utilities.
// The original project exposed a single function (generateSquareMaze) that
// implements the recursive backtracking algorithm.  To keep backwards
// compatibility we still expose that function, but under the hood we provide
// a feature rich MazeGenerator namespace with multiple algorithms, solving
// helpers and rendering utilities.

(function (global) {
    'use strict';

    // ------------------------------------------------------------
    // Utility helpers shared across multiple algorithms
    // ------------------------------------------------------------

    function ensureOdd(value) {
        value = Math.floor(value);
        if (value < 3) {
            value = 3;
        }
        return value % 2 === 0 ? value + 1 : value;
    }

    function createGrid(width, height) {
        width = ensureOdd(width);
        height = ensureOdd(height);

        var grid = new Array(width);
        grid.width = width;
        grid.height = height;
        if (width === height) {
            grid.dimension = width;
        }

        for (var x = 0; x < width; x++) {
            grid[x] = new Array(height);
            for (var y = 0; y < height; y++) {
                grid[x][y] = true; // true represents a wall, false a passage
            }
        }

        return grid;
    }

    function inBounds(grid, x, y) {
        return x >= 0 && x < grid.width && y >= 0 && y < grid.height;
    }

    function isPassage(grid, x, y) {
        return inBounds(grid, x, y) && grid[x][y] === false;
    }

    function forEachPassageNeighbor(grid, x, y, fn) {
        var dirs = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
        ];
        for (var i = 0; i < dirs.length; i++) {
            var nx = x + dirs[i][0];
            var ny = y + dirs[i][1];
            if (isPassage(grid, nx, ny)) {
                fn(nx, ny);
            }
        }
    }

    function shuffle(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = array[i];
            array[i] = array[j];
            array[j] = tmp;
        }
        return array;
    }

    // ------------------------------------------------------------
    // Depth first search / recursive backtracking (legacy default)
    // ------------------------------------------------------------

    function carveDepthFirst(grid, x, y, visited) {
        grid[x][y] = false;
        visited[x + ':' + y] = true;

        var directions = shuffle([
            [2, 0],
            [-2, 0],
            [0, 2],
            [0, -2]
        ]);

        for (var i = 0; i < directions.length; i++) {
            var dx = directions[i][0];
            var dy = directions[i][1];
            var nx = x + dx;
            var ny = y + dy;
            if (inBounds(grid, nx, ny) && grid[nx][ny] === true) {
                grid[x + dx / 2][y + dy / 2] = false;
                carveDepthFirst(grid, nx, ny, visited);
            }
        }
    }

    function generateDepthFirst(options) {
        var width = ensureOdd(options.width || options.dimension || 21);
        var height = ensureOdd(options.height || options.dimension || width);
        var grid = createGrid(width, height);

        carveDepthFirst(grid, 1, 1, {});
        return grid;
    }

    // ------------------------------------------------------------
    // Prim's algorithm (randomized)
    // ------------------------------------------------------------

    function addFrontiers(grid, x, y, frontier, marker) {
        var dirs = [
            [2, 0],
            [-2, 0],
            [0, 2],
            [0, -2]
        ];
        for (var i = 0; i < dirs.length; i++) {
            var nx = x + dirs[i][0];
            var ny = y + dirs[i][1];
            if (inBounds(grid, nx, ny) && grid[nx][ny] === true && !marker[nx + ':' + ny]) {
                marker[nx + ':' + ny] = true;
                frontier.push([nx, ny, x, y]);
            }
        }
    }

    function generatePrim(options) {
        var width = ensureOdd(options.width || options.dimension || 21);
        var height = ensureOdd(options.height || options.dimension || width);
        var grid = createGrid(width, height);

        var frontier = [];
        var marked = {};
        grid[1][1] = false;
        addFrontiers(grid, 1, 1, frontier, marked);

        while (frontier.length > 0) {
            var index = Math.floor(Math.random() * frontier.length);
            var entry = frontier.splice(index, 1)[0];
            var x = entry[0];
            var y = entry[1];
            var px = entry[2];
            var py = entry[3];

            if (grid[x][y] === false) {
                continue;
            }

            grid[x][y] = false;
            grid[(x + px) / 2][(y + py) / 2] = false;
            addFrontiers(grid, x, y, frontier, marked);
        }

        return grid;
    }

    // ------------------------------------------------------------
    // Kruskal's algorithm
    // ------------------------------------------------------------

    function DisjointSet(size) {
        this.parent = new Array(size);
        this.rank = new Array(size);
        for (var i = 0; i < size; i++) {
            this.parent[i] = i;
            this.rank[i] = 0;
        }
    }

    DisjointSet.prototype.find = function (x) {
        if (this.parent[x] !== x) {
            this.parent[x] = this.find(this.parent[x]);
        }
        return this.parent[x];
    };

    DisjointSet.prototype.union = function (x, y) {
        var rootX = this.find(x);
        var rootY = this.find(y);

        if (rootX === rootY) {
            return false;
        }

        if (this.rank[rootX] < this.rank[rootY]) {
            this.parent[rootX] = rootY;
        } else if (this.rank[rootX] > this.rank[rootY]) {
            this.parent[rootY] = rootX;
        } else {
            this.parent[rootY] = rootX;
            this.rank[rootX]++;
        }
        return true;
    };

    function generateKruskal(options) {
        var width = ensureOdd(options.width || options.dimension || 21);
        var height = ensureOdd(options.height || options.dimension || width);
        var grid = createGrid(width, height);

        var cellColumns = Math.floor(width / 2);
        var cellRows = Math.floor(height / 2);
        var cellCount = cellColumns * cellRows;

        var dsu = new DisjointSet(cellCount);
        var indexMap = {};
        var idx = 0;

        for (var cx = 0; cx < cellColumns; cx++) {
            for (var cy = 0; cy < cellRows; cy++) {
                indexMap[cx + ':' + cy] = idx;
                var gx = cx * 2 + 1;
                var gy = cy * 2 + 1;
                grid[gx][gy] = false;
                idx++;
            }
        }

        var edges = [];

        for (var x = 0; x < cellColumns; x++) {
            for (var y = 0; y < cellRows; y++) {
                if (x + 1 < cellColumns) {
                    edges.push({
                        from: indexMap[x + ':' + y],
                        to: indexMap[(x + 1) + ':' + y],
                        between: [x * 2 + 2, y * 2 + 1],
                        weight: Math.random()
                    });
                }
                if (y + 1 < cellRows) {
                    edges.push({
                        from: indexMap[x + ':' + y],
                        to: indexMap[x + ':' + (y + 1)],
                        between: [x * 2 + 1, y * 2 + 2],
                        weight: Math.random()
                    });
                }
            }
        }

        edges.sort(function (a, b) {
            return a.weight - b.weight;
        });

        for (var e = 0; e < edges.length; e++) {
            var edge = edges[e];
            if (dsu.union(edge.from, edge.to)) {
                var bx = edge.between[0];
                var by = edge.between[1];
                grid[bx][by] = false;
            }
        }

        return grid;
    }

    // ------------------------------------------------------------
    // Eller's algorithm for rectangular mazes
    // ------------------------------------------------------------

    function generateEller(options) {
        var width = ensureOdd(options.width || options.dimension || 21);
        var height = ensureOdd(options.height || options.dimension || width);
        var grid = createGrid(width, height);

        var cellColumns = Math.floor(width / 2);
        var cellRows = Math.floor(height / 2);
        var sets = new Array(cellColumns);
        var nextSetId = 1;

        for (var row = 0; row < cellRows; row++) {
            for (var col = 0; col < cellColumns; col++) {
                if (!sets[col]) {
                    sets[col] = nextSetId++;
                }
                grid[col * 2 + 1][row * 2 + 1] = false;
            }

            // Horizontal connections
            for (col = 0; col < cellColumns - 1; col++) {
                var shouldJoin = Math.random() < (row === cellRows - 1 ? 1 : 0.5);
                if (sets[col] !== sets[col + 1] && shouldJoin) {
                    grid[col * 2 + 2][row * 2 + 1] = false;
                    var oldSet = sets[col + 1];
                    var newSet = sets[col];
                    for (var i = 0; i < sets.length; i++) {
                        if (sets[i] === oldSet) {
                            sets[i] = newSet;
                        }
                    }
                }
            }

            if (row === cellRows - 1) {
                continue;
            }

            // Vertical connections - ensure at least one per set
            var cellsInSet = {};
            for (col = 0; col < cellColumns; col++) {
                var id = sets[col];
                if (!cellsInSet[id]) {
                    cellsInSet[id] = [];
                }
                cellsInSet[id].push(col);
            }

            var newSets = new Array(cellColumns);

            for (var key in cellsInSet) {
                if (!cellsInSet.hasOwnProperty(key)) {
                    continue;
                }
                var columns = cellsInSet[key];
                shuffle(columns);
                var openings = [];
                for (var o = 0; o < columns.length; o++) {
                    if (Math.random() < 0.5) {
                        openings.push(columns[o]);
                    }
                }
                if (openings.length === 0) {
                    openings.push(columns[0]);
                }
                for (o = 0; o < openings.length; o++) {
                    var openCol = openings[o];
                    grid[openCol * 2 + 1][row * 2 + 2] = false;
                    newSets[openCol] = nextSetId++;
                }
            }

            for (col = 0; col < cellColumns; col++) {
                if (!newSets[col]) {
                    newSets[col] = nextSetId++;
                }
            }

            sets = newSets;
        }

        return grid;
    }

    // ------------------------------------------------------------
    // Maze analysis helpers
    // ------------------------------------------------------------

    function bfs(grid, startX, startY) {
        var queue = [[startX, startY, 0]];
        var visited = {};
        var parents = {};
        visited[startX + ':' + startY] = true;
        var farthest = {
            x: startX,
            y: startY,
            distance: 0
        };

        while (queue.length > 0) {
            var node = queue.shift();
            var x = node[0];
            var y = node[1];
            var d = node[2];

            if (d > farthest.distance) {
                farthest = { x: x, y: y, distance: d };
            }

            forEachPassageNeighbor(grid, x, y, function (nx, ny) {
                var key = nx + ':' + ny;
                if (!visited[key]) {
                    visited[key] = true;
                    parents[key] = x + ':' + y;
                    queue.push([nx, ny, d + 1]);
                }
            });
        }

        return {
            farthest: farthest,
            parents: parents,
            visited: visited
        };
    }

    function reconstructPath(parents, endX, endY) {
        var path = [];
        var key = endX + ':' + endY;
        while (key) {
            var parts = key.split(':');
            path.push([parseInt(parts[0], 10), parseInt(parts[1], 10)]);
            key = parents[key];
        }
        path.reverse();
        return path;
    }

    function chooseStartEnd(grid, strategy) {
        strategy = strategy || 'longest-path';

        var startX = 1;
        var startY = 1;

        // If 1,1 is a wall, find the first passage cell
        if (!isPassage(grid, startX, startY)) {
            outer: for (var x = 0; x < grid.width; x++) {
                for (var y = 0; y < grid.height; y++) {
                    if (grid[x][y] === false) {
                        startX = x;
                        startY = y;
                        break outer;
                    }
                }
            }
        }

        if (strategy === 'corners') {
            return {
                start: { x: startX, y: startY },
                end: { x: grid.width - 2, y: grid.height - 2 }
            };
        }

        var firstBfs = bfs(grid, startX, startY);
        var secondBfs = bfs(grid, firstBfs.farthest.x, firstBfs.farthest.y);

        return {
            start: { x: firstBfs.farthest.x, y: firstBfs.farthest.y },
            end: { x: secondBfs.farthest.x, y: secondBfs.farthest.y },
            path: reconstructPath(secondBfs.parents, secondBfs.farthest.x, secondBfs.farthest.y)
        };
    }

    function solveMaze(grid, start, end) {
        var queue = [[start.x, start.y, null]];
        var visited = {};
        visited[start.x + ':' + start.y] = true;
        var parents = {};

        while (queue.length > 0) {
            var node = queue.shift();
            var x = node[0];
            var y = node[1];

            if (x === end.x && y === end.y) {
                return reconstructPath(parents, x, y);
            }

            forEachPassageNeighbor(grid, x, y, function (nx, ny) {
                var key = nx + ':' + ny;
                if (!visited[key]) {
                    visited[key] = true;
                    parents[key] = x + ':' + y;
                    queue.push([nx, ny, node]);
                }
            });
        }

        return [];
    }

    function findLongestPath(grid) {
        var start = chooseStartEnd(grid, 'longest-path');
        return start.path;
    }

    function mazeToString(grid) {
        var lines = [];
        for (var y = 0; y < grid.height; y++) {
            var row = '';
            for (var x = 0; x < grid.width; x++) {
                row += grid[x][y] ? '#' : ' ';
            }
            lines.push(row);
        }
        return lines.join('\n');
    }

    function drawMazeOnCanvas(canvas, grid, options) {
        if (!canvas || !canvas.getContext) {
            throw new Error('A valid <canvas> element is required for drawing.');
        }
        options = options || {};
        var ctx = canvas.getContext('2d');
        var cellSize = options.cellSize || 10;
        canvas.width = grid.width * cellSize;
        canvas.height = grid.height * cellSize;
        ctx.fillStyle = options.wallColor || '#111827';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = options.passageColor || '#e2e8f0';

        for (var x = 0; x < grid.width; x++) {
            for (var y = 0; y < grid.height; y++) {
                if (!grid[x][y]) {
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
            }
        }

        if (options.start) {
            ctx.fillStyle = options.startColor || '#38bdf8';
            ctx.fillRect(options.start.x * cellSize, options.start.y * cellSize, cellSize, cellSize);
        }

        if (options.end) {
            ctx.fillStyle = options.endColor || '#f97316';
            ctx.fillRect(options.end.x * cellSize, options.end.y * cellSize, cellSize, cellSize);
        }

        if (options.path && options.path.length > 0) {
            ctx.fillStyle = options.pathColor || '#22c55e';
            for (var p = 0; p < options.path.length; p++) {
                var point = options.path[p];
                ctx.fillRect(point[0] * cellSize, point[1] * cellSize, cellSize, cellSize);
            }
        }
    }

    // ------------------------------------------------------------
    // Hexagonal maze support (axial coordinates, Prim variant)
    // ------------------------------------------------------------

    var HEX_DIRECTIONS = [
        [1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]
    ];

    function hexKey(q, r) {
        return q + ',' + r;
    }

    function generateHexMaze(options) {
        options = options || {};
        var radius = Math.max(1, Math.floor(options.radius || 3));
        var cells = {};
        var keys = [];
        for (var q = -radius; q <= radius; q++) {
            var rMin = Math.max(-radius, -q - radius);
            var rMax = Math.min(radius, -q + radius);
            for (var r = rMin; r <= rMax; r++) {
                var key = hexKey(q, r);
                cells[key] = {
                    q: q,
                    r: r,
                    connections: []
                };
                keys.push(key);
            }
        }

        if (keys.length === 0) {
            return { radius: radius, cells: cells };
        }

        var startKey = keys[Math.floor(Math.random() * keys.length)];
        var visited = {};
        visited[startKey] = true;
        var frontier = [];

        function addHexFrontiers(key) {
            var parts = key.split(',');
            var q = parseInt(parts[0], 10);
            var r = parseInt(parts[1], 10);
            for (var i = 0; i < HEX_DIRECTIONS.length; i++) {
                var nq = q + HEX_DIRECTIONS[i][0];
                var nr = r + HEX_DIRECTIONS[i][1];
                var nKey = hexKey(nq, nr);
                if (cells[nKey] && !visited[nKey]) {
                    frontier.push([key, nKey]);
                }
            }
        }

        addHexFrontiers(startKey);

        while (frontier.length > 0) {
            var choiceIndex = Math.floor(Math.random() * frontier.length);
            var pair = frontier.splice(choiceIndex, 1)[0];
            var from = pair[0];
            var to = pair[1];
            if (visited[to]) {
                continue;
            }
            visited[to] = true;
            cells[from].connections.push(to);
            cells[to].connections.push(from);
            addHexFrontiers(to);
        }

        return {
            radius: radius,
            cells: cells,
            start: startKey
        };
    }

    // ------------------------------------------------------------
    // High level API exposed to the outside
    // ------------------------------------------------------------

    var generators = {
        'depth-first': generateDepthFirst,
        'dfs': generateDepthFirst,
        'prim': generatePrim,
        'kruskal': generateKruskal,
        'eller': generateEller
    };

    function buildMaze(options) {
        options = options || {};
        var algorithmKey = (options.algorithm || 'depth-first').toLowerCase();
        var generator = generators[algorithmKey];

        if (!generator) {
            throw new Error('Unknown maze generation algorithm: ' + options.algorithm);
        }

        var grid = generator(options);
        var result = {
            field: grid,
            algorithm: algorithmKey,
            width: grid.width,
            height: grid.height
        };

        if (options.includeEndpoints) {
            var endpoints = chooseStartEnd(grid, options.endpointStrategy);
            result.start = endpoints.start;
            result.end = endpoints.end;
            if (options.solve) {
                result.solution = solveMaze(grid, endpoints.start, endpoints.end);
            }
        }

        if (options.findLongestPath) {
            result.longestPath = findLongestPath(grid);
        }

        if (options.asString) {
            result.stringRepresentation = mazeToString(grid);
        }

        return result;
    }

    var MazeGenerator = {
        build: buildMaze,
        generateDepthFirst: generateDepthFirst,
        generatePrim: generatePrim,
        generateKruskal: generateKruskal,
        generateEller: generateEller,
        generateHex: generateHexMaze,
        chooseEndpoints: chooseStartEnd,
        solve: solveMaze,
        longestPath: findLongestPath,
        toString: mazeToString,
        drawOnCanvas: drawMazeOnCanvas
    };

    // Preserve backwards compatibility with legacy usage.
    global.generateSquareMaze = function (dimension) {
        var grid = generateDepthFirst({ dimension: dimension });
        grid.dimension = grid.width; // keep legacy property assignment
        return grid;
    };

    global.MazeGenerator = MazeGenerator;

})(typeof window !== 'undefined' ? window : globalThis);

