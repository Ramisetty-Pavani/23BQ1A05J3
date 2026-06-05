const express = require('express');
const axios = require('axios');
const loggingMiddleware = require('./middleware/loggingMiddleware'); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(loggingMiddleware);
app.use(express.json());

app.get('/api/schedule', async (req, res) => {
    try {
        const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJwYXZhbmlyYW1pc2V0dHk5NzZAZ21haWwuY29tIiwiZXhwIjoxNzgwNjM5MTMwLCJpYXQiOjE3ODA2MzgyMzAsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiI0YWY2MDJiNS1iNzg5LTRhOTYtYmVmNC04ZTgyNzZiOGEwZWUiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJyYW1pc2V0dHkgcGF2YW5pIiwic3ViIjoiMDUyZjMwZTEtODhmNi00NjcxLTgwNzgtOGQxMTBiNGI2MjVjIn0sImVtYWlsIjoicGF2YW5pcmFtaXNldHR5OTc2QGdtYWlsLmNvbSIsIm5hbWUiOiJyYW1pc2V0dHkgcGF2YW5pIiwicm9sbE5vIjoiMjNicTFhMDVqMyIsImFjY2Vzc0NvZGUiOiJRUWRFWXkiLCJjbGllbnRJRCI6IjA1MmYzMGUxLTg4ZjYtNDY3MS04MDc4LThkMTEwYjRiNjI1YyIsImNsaWVudFNlY3JldCI6IlJKc0VLelJGdGdCYVB1VE4ifQ.61cFN3n1K48uq1Dd9DhZoqoEoMukk5qH50yzqKRZCy4'; 

        const config = {
            headers: { 
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'access_token': AUTH_TOKEN,
                'token': AUTH_TOKEN,
                'X-API-KEY': AUTH_TOKEN
            }
        };

        const [depotsResponse, vehiclesResponse] = await Promise.all([
            axios.get(`http://4.224.186.213/evaluation-service/depots?token=${AUTH_TOKEN}&access_token=${AUTH_TOKEN}`, config),
            axios.get(`http://4.224.186.213/evaluation-service/vehicles?token=${AUTH_TOKEN}&access_token=${AUTH_TOKEN}`, config)
        ]);

        const depots = depotsResponse.data.depots || depotsResponse.data;
        const tasks = vehiclesResponse.data.vehicles || vehiclesResponse.data.tasks || vehiclesResponse.data;

        console.log("Depots fetched successfully:", Array.isArray(depots) ? depots.length : typeof depots);

        const finalSchedule = depots.map(depot => {
            const availableHours = depot.MechanicHours;
            const optimizedTasks = solveKnapsack(tasks, availableHours);

            return {
                depotId: depot.ID,
                allocatedMechanicHours: availableHours,
                totalHoursUsed: optimizedTasks.totalHours,
                totalImpactScore: optimizedTasks.totalImpact,
                selectedTasks: optimizedTasks.selectedTasks
            };
        }); // <--- Fixed: Properly closed the map block

        // Added: Send the successful optimized schedule response back to the browser!
        return res.status(200).json({
            success: true,
            schedule: finalSchedule
        });

    } catch (error) { // <--- Fixed: Handled try block lifecycle alignment
        return res.status(500).json({ 
            error: 'Internal Server Error', 
            details: error.message,
            responseError: error.response ? error.response.data : 'No details'
        });
    }
});

function solveKnapsack(tasks, maxHours) {
    const n = tasks.length;
    const dp = Array(n + 1).fill(null).map(() => Array(maxHours + 1).fill(0));

    for (let i = 1; i <= n; i++) {
        const currentTask = tasks[i - 1];
        const duration = currentTask.Duration;
        const impact = currentTask.Impact;

        for (let w = 0; w <= maxHours; w++) {
            if (duration <= w) {
                dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - duration] + impact);
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }

    let w = maxHours;
    const selectedTasks = [];
    let totalHours = 0;

    for (let i = n; i > 0; i--) {
        if (dp[i][w] !== dp[i - 1][w]) {
            const chosenTask = tasks[i - 1];
            selectedTasks.push(chosenTask);
            totalHours += chosenTask.Duration;
            w -= chosenTask.Duration;
        }
    }

    return {
        totalImpact: dp[n][maxHours],
        totalHours: totalHours,
        selectedTasks: selectedTasks.reverse()
    };
}

app.listen(PORT, () => {
    console.log(`Scheduler service running on port ${PORT}`); 
});