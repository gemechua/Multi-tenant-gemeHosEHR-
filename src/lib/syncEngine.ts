
export const syncWithBackoff = async (operation: () => Promise<any>, maxRetries = 5, baseInterval = 1000) => {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            return await operation();
        } catch (error) {
            retries++;
            if (retries >= maxRetries) throw error;
            const delay = baseInterval * Math.pow(2, retries) + Math.random() * 500;
            console.log(`Sync failed, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};
