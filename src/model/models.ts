type Room = {
    id: string;
    code: string;
    private: boolean;
    user1: any;
    user2 : any;
    full: boolean;
    game: Game;
};

interface Game {
    name: string;
    turn: any;
    board?: number[];
    words?: string;
    start?: number;
    word?: string;
};

export {Room, Game}