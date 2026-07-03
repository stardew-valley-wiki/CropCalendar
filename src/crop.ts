interface ICrop {
    Name: string;
    Eng: string;
    Stages: number[];
    RegrowTime: number;
}

class Crop implements ICrop
{
    /**
     * 作物的中文名称
     */
    public Name: string;

    /**
     * 作物的英文名称
     */
    public Eng: string;

    /**
     * 作物的生长阶段
     */
    public Stages: number[];

    /**
     * 若可以多次收获，再次生长的周期是多少
     */
    public RegrowTime: number;

    /**
     * 是否可种植在水边加速生长
     */
    public WaterAccelerate: boolean;

    /**
     * 作物生长至成熟所需的时间
     */
    private readonly growTime: number;

    constructor(name: string, englishName: string, stages: number[], regrowTime: number)
    {
        this.Name = name;
        this.Eng = englishName;
        this.Stages = stages;
        this.RegrowTime = regrowTime;
        this.WaterAccelerate = name === "未碾米" || name === "芋头";

        this.growTime = 0;
        for (const stage of stages)
        {
            this.growTime += stage;
        }
    }

    /**
     * 计算在播种当天施肥的作物各个阶段的生长时间，即完全加速。
     * @param rate 激素加速倍率
     */
    public GetFertilizedGrowTime(rate: number): number[]
    {
        const stageNum = this.Stages.length;

        let accelerated = Math.ceil(this.growTime * rate); // 加速时间向上取整
        let finalStages = this.Stages.slice();

        let i = 0;
        while (accelerated > 0)
        {
            let stage = i % stageNum;

            //   种子阶段，保证种子阶段至少有一天                非种子阶段，保证当前阶段不为 0
            if ((stage == 0 && finalStages[0] > 1) || (stage != 0 && finalStages[stage] > 0))
            {
                finalStages[stage] -= 1;
                accelerated -= 1;
            }

            i += 1;
        }

        return finalStages;
    }

    /**
     * 计算在播种后施肥的作物各个阶段的生长时间，即非完全加速。
     * @param rate 激素加速倍率
     * @param fertilizedAt 在作物种下几天后施肥
     */
    public GetPartialFertilizedGrowTime(rate: number, fertilizedAt: number): number[]
    {
        const stageNum = this.Stages.length;
        const fullFertilized = this.GetFertilizedGrowTime(rate);
        let finalStages = this.Stages.slice();

        let i = 0;
        while (fertilizedAt >= finalStages[i])
        {
            fertilizedAt -= finalStages[i];
            i += 1;
        }

        finalStages[i] = Math.max(fertilizedAt, fullFertilized[i]);
        i += 1;

        while (i < stageNum)
        {
            finalStages[i] = fullFertilized[i];
            i += 1;
        }

        return finalStages;
    }

    public GetRelatedImages(): string[]
    {
        const images: string[] = [];
        for (let i = 1; i <= this.Stages.length; i++)
        {
            images.push(`${this.Eng} Stage ${i}.png`);
        }
        images.push(`${this.Eng}.png`)
        return images;
    }
}

const rawCropData: ICrop[] = [
    { Eng: "Parsnip",        Stages: [1, 1, 1, 1],    RegrowTime: -1, Name: "防风草" },
    { Eng: "Cauliflower",    Stages: [1, 2, 4, 4, 1], RegrowTime: -1, Name: "花椰菜", },
    { Eng: "Potato",         Stages: [1, 1, 1, 2, 1], RegrowTime: -1, Name: "土豆", },
    { Eng: "Kale",           Stages: [1, 2, 2, 1],    RegrowTime: -1, Name: "甘蓝菜", },
    { Eng: "Garlic",         Stages: [1, 1, 1, 1],    RegrowTime: -1, Name: "蒜", },
    { Eng: "Rhubarb",        Stages: [2, 2, 2, 3, 4], RegrowTime: -1, Name: "大黄", },

    { Eng: "Melon",          Stages: [1, 2, 3, 3, 3], RegrowTime: -1, Name: "甜瓜", },
    { Eng: "Wheat",          Stages: [1, 1, 1, 1],    RegrowTime: -1, Name: "小麦", },
    { Eng: "Radish",         Stages: [2, 1, 2, 1],    RegrowTime: -1, Name: "萝卜", },
    { Eng: "Red Cabbage",    Stages: [2, 1, 2, 2, 2], RegrowTime: -1, Name: "红叶卷心菜", },
    { Eng: "Starfruit",      Stages: [2, 3, 2, 3, 3], RegrowTime: -1, Name: "杨桃", },


    { Eng: "Pumpkin",        Stages: [1, 2, 3, 4, 3], RegrowTime: -1, Name: "南瓜", },
    { Eng: "Bok Choy",       Stages: [1, 1, 1, 1],    RegrowTime: -1, Name: "小白菜", },
    { Eng: "Yam",            Stages: [1, 3, 3, 3],    RegrowTime: -1, Name: "山药", },
    { Eng: "Amaranth",       Stages: [1, 2, 2, 2],    RegrowTime: -1, Name: "苋菜", },
    { Eng: "Artichoke",      Stages: [2, 2, 1, 2, 1], RegrowTime: -1, Name: "洋蓟", },
    { Eng: "Beet",           Stages: [1, 1, 2, 2],    RegrowTime: -1, Name: "甜菜", },


    { Eng: "Tulip",          Stages: [1, 1, 2, 2],    RegrowTime: -1, Name: "郁金香", },
    { Eng: "Blue Jazz",      Stages: [1, 2, 2, 2],    RegrowTime: -1, Name: "蓝爵", },
    { Eng: "Summer Spangle", Stages: [1, 2, 3, 2],    RegrowTime: -1, Name: "夏季亮片", },
    { Eng: "Poppy",          Stages: [1, 2, 2, 2],    RegrowTime: -1, Name: "虞美人花", },
    { Eng: "Sunflower",      Stages: [1, 2, 3, 2],    RegrowTime: -1, Name: "向日葵", },
    { Eng: "Fairy Rose",     Stages: [1, 4, 4, 3],    RegrowTime: -1, Name: "玫瑰仙子", },

    { Eng: "Unmilled Rice",  Stages: [1, 2, 2, 3],    RegrowTime: -1, Name: "未碾米", },
    { Eng: "Taro Root",      Stages: [1, 2, 3, 4],    RegrowTime: -1, Name: "芋头", },
    { Eng: "Qi Fruit",       Stages: [1, 1, 1, 1],    RegrowTime: -1, Name: "齐瓜", },
    { Eng: "Carrot",         Stages: [1, 1, 1],       RegrowTime: -1, Name: "胡萝卜", },
    { Eng: "Powdermelon",    Stages: [1, 1, 1, 2, 2], RegrowTime: -1, Name: "霜瓜", },

    { Eng: "Strawberry",     Stages: [1, 1, 2, 2, 2], RegrowTime: 4,  Name: "草莓", },
    { Eng: "Green Bean",     Stages: [1, 1, 1, 3, 4], RegrowTime: 3,  Name: "青豆", },

    { Eng: "Tomato",         Stages: [2, 2, 2, 2, 3], RegrowTime: 4,  Name: "西红柿", },
    { Eng: "Hops",           Stages: [1, 1, 2, 3, 4], RegrowTime: 1,  Name: "啤酒花", },
    { Eng: "Blueberry",      Stages: [1, 3, 3, 4, 2], RegrowTime: 4,  Name: "蓝莓", },
    { Eng: "Hot Pepper",     Stages: [1, 1, 1, 1, 1], RegrowTime: 3,  Name: "辣椒", },
    { Eng: "Corn",           Stages: [2, 3, 3, 3, 3], RegrowTime: 4,  Name: "玉米", },

    { Eng: "Eggplant",       Stages: [1, 1, 1, 1, 1], RegrowTime: 5,  Name: "茄子", },
    { Eng: "Cranberries",    Stages: [1, 2, 1, 1, 2], RegrowTime: 5,  Name: "蔓越莓", },
    { Eng: "Grape",          Stages: [1, 1, 2, 3, 3], RegrowTime: 3,  Name: "葡萄", },

    { Eng: "Cactus Fruit",   Stages: [2, 2, 2, 3, 3], RegrowTime: 3,  Name: "仙人掌果子", },
    { Eng: "Ancient Fruit",  Stages: [2, 7, 7, 7, 5], RegrowTime: 7,  Name: "上古水果", },
    { Eng: "Pineapple",      Stages: [1, 3, 3, 4, 3], RegrowTime: 7,  Name: "菠萝", },

    { Eng: "Summer Squash",  Stages: [1, 1, 1, 1, 2], RegrowTime: 3,  Name: "金皮西葫芦", },
    { Eng: "Broccoli",       Stages: [1, 2, 2, 3],    RegrowTime: 4,  Name: "西蓝花", },
    { Eng: "Sweet Gem Berry", Stages: [2, 4, 6, 6, 6], RegrowTime: -1, Name: "宝石甜莓", }
];

const cropData: Crop[] = rawCropData.map(item =>
    new Crop(item.Name, item.Eng, item.Stages, item.RegrowTime));

function GetCrop(name: string): Crop | null
{
    return cropData.find(item => item.Name == name) ?? null;
}