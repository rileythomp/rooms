import internal from "stream";

type Game = {
    id: string;
    code: string;
    players: Player[];
};

type Player = {
    name: string;
    score: number;
}

export {Game}
