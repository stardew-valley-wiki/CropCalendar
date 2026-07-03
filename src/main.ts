declare const mw: any;

let cache: Map<string, string> = new Map();
let crop: Crop | null;

/**
 * 获取加速倍率
 */
function getAccelerate(): [number, string]
{
    // 激素类型
    const speedGroSelect = document.getElementById('speed-gro') as HTMLSelectElement;
    const speedGroValue = speedGroSelect.value;
    const speedGroName = speedGroSelect.options[speedGroSelect.selectedIndex].text;

    // 是否农业学家
    const agriculturistCheckbox = document.getElementById('agriculturist') as HTMLInputElement;
    const isAgriculturist = agriculturistCheckbox.checked;

    // 是否临近水源
    const waterAccelerateCheckbox = document.getElementById('water-accelerate') as HTMLInputElement;
    const waterAccelerate = waterAccelerateCheckbox.checked;

    let rate = 0;
    let desc;
    switch (speedGroValue)
    {
        case 'basic':
            rate = 0.1;
            desc = speedGroName;
            break;
        case 'deluxe':
            rate = 0.25;
            desc = speedGroName;
            break;
        case 'hyper':
            rate = 0.33;
            desc = speedGroName;
            break;
        default:
            desc = "无任何加成";
            break;
    }

    if (isAgriculturist)
    {
        if (rate > 0)
        {
            desc = speedGroName + " + 农业学家";
        }
        else
        {
            desc = "农业学家";
        }
        rate += 0.1;
    }

    if (waterAccelerate)
    {
        rate += 0.25;
        desc += " + 临近水源";
    }

    desc += `（${(rate * 100).toFixed(0)}%）`;

    return [rate, desc];
}

/**
 * 获取图片 URL (带缓存)
 * @param fileName 文件名，例如 "Apple.png"
 * @param width 宽度，例如 48
 */
async function getImageUrl(fileName: string, width: number = 48): Promise<string>
{
    // 检查缓存，如果有直接返回
    if (cache.has(fileName))
    {
        return cache.get(fileName)!;
    }

    // 请求 API 获取图片信息
    try
    {
        const api = new mw.Api();
        const response = await api.get({
            action: 'query',
            titles: `File:${fileName}`,
            prop: 'imageinfo',
            iiprop: 'url',
            iiurlwidth: width
        });

        // 解析 API 返回的数据结构
        const pages = response.query.pages;
        const pageId = Object.keys(pages)[0];
        const pageData = pages[pageId];

        // 如果页面存在（pageId 不为 -1）
        if (pageId !== "-1" && pageData.imageinfo)
        {
            const url = pageData.imageinfo[0].thumburl || pageData.imageinfo[0].url;
            cache.set(fileName, url);
            return url;
        }
        else
        {
            console.error(`图片 ${fileName} 不存在`);
            return "";
        }
    }
    catch (error)
    {
        console.error("获取图片失败:", error);
        return "";
    }
}

/**
 * 获取表格 html
 */
async function getTableHtml(fileName: string, width: number = 48): Promise<string>
{
    if (!fileName)
        return "";

    // 获取 URL
    const url = await getImageUrl(fileName, width);

    if (url)
    {
        return `<td><div class="center"><div class="floatnone">
                <img alt="${fileName}" src="${url}" decoding="async" loading="lazy" width="${width}">
                </div></div></td>`;
    }
    else
    {
        return "";
    }
}

async function renderAll(): Promise<void>
{
    if (crop == null)
        return;

    const accelerate: number = getAccelerate()[0];
    const desc: string = getAccelerate()[1];
    const stages: number[] = crop.GetFertilizedGrowTime(accelerate);
    if (!stages)
        return;

    // 种子天数阶段 -1，先往 images 里塞一张种子阶段
    let images: string[] = []
    stages[0] -= 1;
    images.push(`${crop.Eng} Stage 1.png`)

    // 然后往 stages 的最后塞一张果实阶段
    stages.push(1)

    // 扁平化 stages
    let flattened_stages: number[] = [];
    for (let i = 1; i <= stages.length; i++)
    {
        // 果实阶段
        if (i === stages.length)
        {
            flattened_stages.push(99);
        }
        // 生长阶段
        else
        {
            for (let j = 0; j < stages[i - 1]; j++)
            {
                flattened_stages.push(i);
            }
        }
    }

    // 开始填充生长阶段
    let i = 0;
    let recycle = false;
    while (images.length < 28)
    {
        // 多次收获作物进入循环生长阶段
        if (recycle)
        {
            if (i < crop.RegrowTime)
            {
                images.push(`${crop.Eng} Stage ${flattened_stages[flattened_stages.length - 2]}.png`);
                i++;
            }
            else
            {
                images.push(`${crop.Eng}.png`);
                i = 1;
            }
            continue;
        }

        // 播种至成熟阶段
        const index = i % flattened_stages.length;
        const fullGrown = flattened_stages[index] === 99;
        if (fullGrown)
        {
            images.push(`${crop.Eng}.png`);
            if (crop.RegrowTime > 0)
            {
                recycle = true;
                i = 1;
                continue;
            }
        }
        else
        {
            images.push(`${crop.Eng} Stage ${flattened_stages[index]}.png`);
        }
        i++;
    }

    // 填充表格
    const el = document.getElementById('crop-table');
    if (!el) return;
    el.innerHTML = `
        <tr>
            <th colspan="7" id="title">${desc}</th>
        </tr>
        <tr>
            <th style="width: 48px;">一</th>
            <th style="width: 48px;">二</th>
            <th style="width: 48px;">三</th>
            <th style="width: 48px;">四</th>
            <th style="width: 48px;">五</th>
            <th style="width: 48px;">六</th>
            <th style="width: 48px;">日</th>
        </tr>
    `

    for (let week = 0; week < 4; week++)
    {
        let html = "<tr>";
        for (let day = 0; day < 7; day++)
        {
            html += await getTableHtml(images[week * 7 + day]);
        }
        html += "</tr>";
        el.innerHTML += html;
    }
}

function registerListener(id: string): void
{
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener("change", renderAll);
}

function main(): void
{
    const currentPageName = mw.config.get('wgPageName');
    const cropParam = document.getElementById('crop-name')?.innerText ?? "";
    crop = GetCrop(currentPageName) ?? GetCrop(cropParam);

    if (crop == null)
        return;

    // 先缓存图片
    for (const image in crop.GetRelatedImages())
    {
        getImageUrl(image).then();
    }

    // 如果是水稻或者芋头，显示临近水源选项
    if (crop.WaterAccelerate)
    {
        document.getElementById('water-accelerate-setting')?.style.removeProperty('display');
    }

    const controlIds = ['speed-gro', 'agriculturist', 'water-accelerate'];
    controlIds.forEach(registerListener);
    renderAll().catch(err => console.error(err));
}

((window as any).RLQ = (window as any).RLQ || []).push([["mediawiki.api"], main]);
