import { Loader2 } from "lucide-react";
import React from "react";

const Loading = () => {
    return (
        <div className="flex w-full h-screen items-center justify-center bg-white dark:bg-background">
            <Loader2 className="h-10 w-10 animate-spin text-bankGradient" />
            <span className="ml-2 text-16 font-semibold text-gray-500 dark:text-gray-100">Loading...</span>
        </div>
    );
};

export default Loading;
