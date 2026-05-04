from __future__ import annotations

import copy
import json
import math
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "assets"
OUT_DIR = SOURCE_DIR / "Разделенные ассеты"

SVG_NS = "http://www.w3.org/2000/svg"
XLINK_NS = "http://www.w3.org/1999/xlink"
ET.register_namespace("", SVG_NS)
ET.register_namespace("xlink", XLINK_NS)

NUMBER_RE = re.compile(r"[-+]?(?:\d+\.\d+|\d+|\.\d+)(?:[eE][-+]?\d+)?")
PATH_TOKEN_RE = re.compile(r"([AaCcHhLlMmQqSsTtVvZz])|([-+]?(?:\d+\.\d+|\d+|\.\d+)(?:[eE][-+]?\d+)?)")
URL_REF_RE = re.compile(r"url\(#([^)]+)\)")
HREF_ATTRS = {f"{{{XLINK_NS}}}href", "href"}

GRAPHIC_TAGS = {
    "path",
    "rect",
    "circle",
    "ellipse",
    "line",
    "polyline",
    "polygon",
    "image",
    "use",
}
CONTAINER_TAGS = {"g", "a", "svg", "switch"}
STRUCTURAL_TAGS = {
    "defs",
    "mask",
    "clipPath",
    "pattern",
    "linearGradient",
    "radialGradient",
    "filter",
    "style",
    "symbol",
}

CATEGORY_SETTINGS = {
    "Иконки": {"gap": 46.0, "padding": 16.0, "min_area": 90.0, "min_side": 8.0},
    "Стиль Английский": {"gap": 8.0, "padding": 20.0, "min_area": 180.0, "min_side": 10.0, "anchor_area": 30000.0, "anchor_gap": 120.0},
    "Стиль Музыка": {"gap": 8.0, "padding": 20.0, "min_area": 180.0, "min_side": 10.0, "anchor_area": 30000.0, "anchor_gap": 120.0},
    "Стиль Учи.ру_завры": {"gap": 8.0, "padding": 20.0, "min_area": 180.0, "min_side": 10.0, "anchor_area": 30000.0, "anchor_gap": 120.0},
    "Стиль Учи.ру_люди": {"gap": 8.0, "padding": 20.0, "min_area": 180.0, "min_side": 10.0, "anchor_area": 30000.0, "anchor_gap": 120.0},
    "Стиль Чумовая ферма": {"gap": 8.0, "padding": 20.0, "min_area": 180.0, "min_side": 10.0, "anchor_area": 30000.0, "anchor_gap": 120.0},
    "default": {"gap": 72.0, "padding": 28.0, "min_area": 180.0, "min_side": 10.0},
}

DESCRIPTIVE_NAMES = {
    "Иконки": [
        "взрослый_и_ребенок",
        "улыбающийся_смайлик",
        "грустный_смайлик",
        "уши",
        "нос",
        "рот",
        "число_11",
        "число_12",
        "число_13",
        "число_14",
        "смайлик_в_колпаке",
        "смайлик_со_звездами",
        "рука_с_кистью",
        "волшебная_книга",
        "гном",
        "зеленый_монстр",
        "эльф",
        "брокколи",
        "человечек",
        "груша",
        "солнце",
        "ночь_с_луной",
        "кошка",
        "собака",
        "принц",
        "король",
        "ребенок_с_дудкой",
        "ребенок_с_ложкой",
        "глаз",
        "зуб",
        "карта_с_меткой",
        "паук",
        "хлопушка",
        "арбуз",
        "морковь",
        "вишня",
        "кошелек",
        "шприц",
        "бутылочка_клея",
        "леденец",
        "куртка",
        "учитель_и_ученики",
        "школа",
        "классная_доска",
        "палитра",
        "корона",
        "профиль_головы",
        "календарь",
        "палец_вниз",
        "календарь_2025_2024",
    ],
    "Стиль Английский": [
        "фиолетовый_кот",
        "красная_лиса",
        "коричневая_собака",
        "фиолетовый_кролик",
        "красная_собака_с_пятном",
        "синяя_обезьяна",
        "английский_класс",
        "набор_английских_карточек",
        "рыба",
        "лампа",
        "брокколи",
        "роликовый_конек",
        "батут",
        "яблоко",
    ],
    "Стиль Музыка": [
        "набор_музыкальных_сцен",
        "музыкальные_червячки",
        "музыкальные_монстры",
        "мегафон",
    ],
    "Стиль Учи.ру_завры": [
        "динозавры_и_персонажи",
        "набор_динозавровых_сцен",
        "динозавр_в_джунглях",
        "домики_динозавров",
        "транспорт_динозавров",
        "декор_динозавров",
    ],
    "Стиль Учи.ру_люди": [
        "трое_детей",
        "лесная_поляна",
        "набор_людей_и_сцен",
    ],
    "Стиль Чумовая ферма": [
        "набор_фермы_и_персонажей",
        "зеленое_поле_темное",
        "зеленое_поле_светлое",
        "фермерские_предметы",
        "горшок_меда",
    ],
}

SEMANTIC_FILE_NAMES = {
    "Стиль Английский": {
        "английская_локация_01.svg": "ванная_комната.svg",
        "английская_локация_02.svg": "игровая_комната.svg",
        "английская_локация_03.svg": "класс_английского.svg",
        "английская_локация_04.svg": "творческая_комната.svg",
        "английская_локация_05.svg": "домик_у_пруда.svg",
        "английская_локация_06.svg": "угол_с_пандой.svg",
        "английская_локация_07.svg": "сцена_с_пандами.svg",
        "английская_локация_08.svg": "домик_и_сад.svg",
        "английская_локация_09.svg": "сад_и_комната.svg",
        "английская_локация_10.svg": "лиса_и_кролик_во_дворе.svg",
        "английская_локация_11.svg": "театр_со_зверятами.svg",
        "английская_локация_12.svg": "домик_с_деревом.svg",
        "английская_локация_13.svg": "домик_и_диван.svg",
        "английская_локация_14.svg": "диван_в_комнате.svg",
        "английская_локация_15.svg": "домик_в_саду.svg",
        "английская_локация_16.svg": "яйцо_и_кусты.svg",
        "английский_объект_01.svg": "фиолетовый_кот.svg",
        "английский_объект_02.svg": "красная_лиса.svg",
        "английский_объект_03.svg": "коричневая_собака.svg",
        "английский_объект_04.svg": "фиолетовый_кролик.svg",
        "английский_объект_05.svg": "собака_с_пятном.svg",
        "английский_объект_06.svg": "синяя_обезьяна.svg",
        "английский_объект_07.svg": "диван_и_штора.svg",
        "английский_объект_08.svg": "диван.svg",
        "английский_объект_09.svg": "кровать.svg",
        "английский_объект_10.svg": "книга.svg",
        "английский_объект_11.svg": "лупа.svg",
        "английский_объект_12.svg": "носок.svg",
        "английский_объект_13.svg": "картина_с_городом.svg",
        "английский_объект_14.svg": "рыба.svg",
        "английский_объект_15.svg": "синяя_карточка.svg",
        "английский_объект_16.svg": "игрушечная_утка.svg",
        "английский_объект_17.svg": "сок.svg",
        "английский_объект_18.svg": "гитара.svg",
        "английский_объект_19.svg": "брокколи.svg",
        "английский_объект_20.svg": "роликовый_конек.svg",
        "английский_объект_21.svg": "стул.svg",
        "английский_объект_22.svg": "мяч.svg",
        "английский_объект_23.svg": "карандаш.svg",
        "английский_объект_24.svg": "батут.svg",
        "английский_объект_25.svg": "стейк.svg",
        "английский_объект_26.svg": "яблоко.svg",
        "английский_объект_27.svg": "лампа.svg",
    },
    "Стиль Музыка": {
        "музыкальная_сцена_01.svg": "синяя_птица_с_тромбоном.svg",
        "музыкальная_сцена_02.svg": "трио_с_пианино.svg",
        "музыкальная_сцена_03.svg": "аккордеон_и_наушники.svg",
        "музыкальная_сцена_04.svg": "барабан_и_труба.svg",
        "музыкальная_сцена_05.svg": "ночной_концерт.svg",
        "музыкальная_сцена_06.svg": "певица_на_сцене.svg",
        "музыкальная_сцена_07.svg": "ночная_сцена.svg",
        "музыкальная_сцена_08.svg": "выступление_с_прожектором.svg",
        "музыкальная_сцена_09.svg": "пляжный_концерт.svg",
        "музыкальная_сцена_10.svg": "неоновый_концерт.svg",
        "музыкальная_сцена_11.svg": "ночной_парк_с_музыкантом.svg",
        "музыкальная_сцена_12.svg": "тропический_концерт.svg",
        "музыкальная_сцена_13.svg": "городской_концерт.svg",
        "музыкальная_сцена_14.svg": "концертные_фрагменты.svg",
        "музыкальная_сцена_15.svg": "ночной_путь.svg",
        "музыкальная_сцена_16.svg": "танцующий_монстр.svg",
        "музыкальная_сцена_17.svg": "радостный_монстр.svg",
        "музыкальная_сцена_18.svg": "лесной_фон.svg",
        "музыкальная_сцена_19.svg": "танец_на_поляне.svg",
        "музыкальная_сцена_20.svg": "поляна_с_персонажем.svg",
        "музыкальная_сцена_21.svg": "музыкальная_тропа.svg",
        "музыкальная_сцена_22.svg": "подводная_сцена.svg",
        "музыкальная_сцена_23.svg": "красная_гармошка.svg",
        "музыкальная_сцена_24.svg": "розовые_червячки.svg",
        "музыкальный_объект_01.svg": "сердитый_черный_монстр.svg",
        "музыкальный_объект_02.svg": "черная_тучка.svg",
        "музыкальный_объект_03.svg": "желтая_тарелка.svg",
        "музыкальный_объект_04.svg": "желтый_банан.svg",
        "музыкальный_объект_05.svg": "оранжевый_кругляш.svg",
        "музыкальный_объект_06.svg": "желтый_бублик.svg",
        "музыкальный_объект_07.svg": "розовый_пушистик.svg",
        "музыкальный_объект_08.svg": "кричащий_розовый_монстр.svg",
        "музыкальный_объект_09.svg": "голубой_цветок.svg",
        "музыкальный_объект_10.svg": "голубой_монстр.svg",
        "музыкальный_объект_11.svg": "красный_монстр.svg",
        "музыкальный_объект_12.svg": "зеленые_усы.svg",
        "музыкальный_объект_13.svg": "зеленая_маска.svg",
        "музыкальный_объект_14.svg": "красная_птица.svg",
        "музыкальный_объект_15.svg": "голубая_звезда.svg",
        "музыкальный_объект_16.svg": "мегафон.svg",
        "музыкальный_объект_17.svg": "голубая_капля.svg",
    },
    "Стиль Учи.ру_завры": {
        "динозавровая_локация_01.svg": "ночной_дом_динозавров.svg",
        "динозавровая_локация_02.svg": "город_динозавров.svg",
        "динозавровая_локация_03.svg": "город_и_ночная_улица.svg",
        "динозавровая_локация_04.svg": "ночная_улица_динозавров.svg",
        "динозавровая_локация_05.svg": "праздник_динозавров.svg",
        "динозавровая_локация_06.svg": "снежная_гора.svg",
        "динозавровая_локация_07.svg": "динозавр_в_джунглях.svg",
        "динозавровая_локация_08.svg": "пиратский_корабль.svg",
        "динозавровая_локация_09.svg": "машина_с_динозаврами.svg",
        "динозавровый_объект_01.svg": "зеленый_динозавр.svg",
        "динозавровый_объект_02.svg": "фиолетовый_динозавр.svg",
        "динозавровый_объект_03.svg": "пират_динозавр.svg",
        "динозавровый_объект_04.svg": "два_динозавра.svg",
        "динозавровый_объект_05.svg": "синий_динозавр.svg",
        "динозавровый_объект_06.svg": "розовый_дракончик.svg",
        "динозавровый_объект_07.svg": "маленький_динозаврик.svg",
        "динозавровый_объект_08.svg": "праздничный_стол.svg",
        "динозавровый_объект_09.svg": "ночные_домики.svg",
        "динозавровый_объект_10.svg": "динозавр_с_шарами.svg",
        "динозавровый_объект_11.svg": "ночной_двор.svg",
        "динозавровый_объект_12.svg": "лодка_в_шторм.svg",
        "динозавровый_объект_13.svg": "комната_с_телевизором.svg",
        "динозавровый_объект_14.svg": "остров_с_динозавром.svg",
        "динозавровый_объект_15.svg": "класс_динозавров.svg",
        "динозавровый_объект_16.svg": "динозавр_с_тыквой.svg",
        "динозавровый_объект_17.svg": "магазин_динозавров.svg",
        "динозавровый_объект_18.svg": "портрет_динозавра.svg",
        "динозавровый_объект_19.svg": "команда_динозавров.svg",
        "динозавровый_объект_20.svg": "снеговик_и_малыш.svg",
        "динозавровый_объект_21.svg": "динозавр_в_комнате.svg",
        "динозавровый_объект_22.svg": "корзина_с_листьями.svg",
        "динозавровый_объект_23.svg": "семья_динозавров.svg",
        "динозавровый_объект_24.svg": "дымок.svg",
        "динозавровый_объект_25.svg": "домик_с_дымком.svg",
        "динозавровый_объект_26.svg": "круглый_домик.svg",
        "динозавровый_объект_27.svg": "хищное_растение.svg",
        "динозавровый_объект_28.svg": "плакат_с_динозавром.svg",
        "динозавровый_объект_29.svg": "башня_из_персонажей.svg",
        "динозавровый_объект_30.svg": "птица.svg",
        "динозавровый_объект_31.svg": "часы_с_кукушкой.svg",
        "динозавровый_объект_32.svg": "птица_с_клювом.svg",
    },
    "Стиль Учи.ру_люди": {
        "объект_люди_01.svg": "оранжевая_собака.svg",
        "объект_люди_02.svg": "деревенский_двор.svg",
        "объект_люди_03.svg": "учитель_и_ученица.svg",
        "объект_люди_04.svg": "мальчик_с_птицей.svg",
        "объект_люди_05.svg": "мальчик_панда.svg",
        "объект_люди_06.svg": "груша.svg",
        "объект_люди_07.svg": "миска_с_фруктами.svg",
        "объект_люди_08.svg": "дерево.svg",
        "объект_люди_09.svg": "зеленое_дерево.svg",
        "объект_люди_10.svg": "половинка_яблока.svg",
        "объект_люди_11.svg": "красное_яблоко.svg",
        "объект_люди_12.svg": "запеченная_курица.svg",
        "объект_люди_13.svg": "пакет_сока.svg",
        "объект_люди_14.svg": "рюкзак_монстрик.svg",
        "объект_люди_15.svg": "тетрадь.svg",
        "объект_люди_16.svg": "книги.svg",
        "объект_люди_17.svg": "темный_куст.svg",
        "объект_люди_18.svg": "зеленый_куст.svg",
        "персонаж_01.svg": "мальчик_в_очках.svg",
        "персонаж_02.svg": "рыжий_мальчик.svg",
        "персонаж_03.svg": "девочка_блондинка.svg",
        "персонаж_04.svg": "собака_и_пудель.svg",
        "сцена_с_людьми_01.svg": "две_кошки.svg",
        "сцена_с_людьми_02.svg": "светлый_двор.svg",
        "сцена_с_людьми_03.svg": "лесная_поляна.svg",
        "сцена_с_людьми_04.svg": "городской_парк.svg",
        "сцена_с_людьми_05.svg": "ночной_парк.svg",
        "сцена_с_людьми_06.svg": "морской_берег.svg",
        "сцена_с_людьми_07.svg": "девочка_на_пляже.svg",
        "сцена_с_людьми_08.svg": "дети_с_печеньем.svg",
        "сцена_с_людьми_09.svg": "девочка_с_дипломом.svg",
        "сцена_с_людьми_10.svg": "дети_играют_на_полу.svg",
        "сцена_с_людьми_11.svg": "велосипедист_вечером.svg",
        "сцена_с_людьми_12.svg": "велосипедист_у_дома.svg",
        "сцена_с_людьми_13.svg": "мальчик_во_дворе.svg",
        "сцена_с_людьми_14.svg": "девочка_на_улице.svg",
        "сцена_с_людьми_15.svg": "пастух_с_овцами.svg",
        "сцена_с_людьми_16.svg": "панды_в_зоопарке.svg",
        "сцена_с_людьми_17.svg": "танцы_на_сцене.svg",
    },
    "Стиль Чумовая ферма": {
        "фермерская_локация_01.svg": "фермер_и_домик.svg",
        "фермерская_локация_02.svg": "персонажи_и_ферма.svg",
        "фермерская_локация_03.svg": "фермер_у_двери.svg",
        "фермерская_локация_04.svg": "лиса_и_кот.svg",
        "фермерская_локация_05.svg": "персонажи_фермы.svg",
        "фермерская_локация_06.svg": "дом_и_персонажи.svg",
        "фермерская_локация_07.svg": "огород_у_дома.svg",
        "фермерская_локация_08.svg": "кухня_и_огород.svg",
        "фермерская_локация_09.svg": "кухня_с_огородом.svg",
        "фермерская_локация_10.svg": "темное_зеленое_поле.svg",
        "фермерская_локация_11.svg": "оранжевое_поле.svg",
        "фермерская_локация_12.svg": "зеленое_поле.svg",
        "фермерская_локация_13.svg": "желтое_поле.svg",
        "фермерская_локация_14.svg": "светлое_зеленое_поле.svg",
        "фермерский_объект_01.svg": "девочка_и_дом.svg",
        "фермерский_объект_02.svg": "ведьма_и_девочка.svg",
        "фермерский_объект_03.svg": "лесной_угол.svg",
        "фермерский_объект_04.svg": "грядка_моркови.svg",
        "фермерский_объект_05.svg": "грядка_капусты.svg",
        "фермерский_объект_06.svg": "домик_в_капусте.svg",
        "фермерский_объект_07.svg": "грядка_цветов.svg",
        "фермерский_объект_08.svg": "грядка_помидоров.svg",
        "фермерский_объект_09.svg": "грибная_грядка.svg",
        "фермерский_объект_10.svg": "тарелка_и_бургер.svg",
        "фермерский_объект_11.svg": "миска_слив.svg",
        "фермерский_объект_12.svg": "овощной_шашлык.svg",
        "фермерский_объект_13.svg": "гриб.svg",
        "фермерский_объект_14.svg": "слива.svg",
        "фермерский_объект_15.svg": "горшок_меда.svg",
        "фермерский_объект_16.svg": "помидор.svg",
        "фермерский_объект_17.svg": "бутылка_молока.svg",
    },
}


Matrix = tuple[float, float, float, float, float, float]
BBox = tuple[float, float, float, float]


@dataclass(frozen=True)
class Leaf:
    bbox: BBox


def strip_namespace(tag: str) -> str:
    return tag.split("}", 1)[-1]


def numbers_from(value: str | None) -> list[float]:
    if not value:
        return []
    return [float(match.group(0)) for match in NUMBER_RE.finditer(value)]


def multiply_matrix(a: Matrix, b: Matrix) -> Matrix:
    aa, ab, ac, ad, ae, af = a
    ba, bb, bc, bd, be, bf = b
    return (
        aa * ba + ac * bb,
        ab * ba + ad * bb,
        aa * bc + ac * bd,
        ab * bc + ad * bd,
        aa * be + ac * bf + ae,
        ab * be + ad * bf + af,
    )


def parse_transform(value: str | None) -> Matrix:
    matrix: Matrix = (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)
    if not value:
        return matrix

    for name, raw_args in re.findall(r"([a-zA-Z]+)\(([^)]*)\)", value):
        args = numbers_from(raw_args)
        name = name.lower()
        local: Matrix | None = None

        if name == "matrix" and len(args) >= 6:
            local = (args[0], args[1], args[2], args[3], args[4], args[5])
        elif name == "translate" and args:
            local = (1.0, 0.0, 0.0, 1.0, args[0], args[1] if len(args) > 1 else 0.0)
        elif name == "scale" and args:
            sx = args[0]
            sy = args[1] if len(args) > 1 else sx
            local = (sx, 0.0, 0.0, sy, 0.0, 0.0)
        elif name == "rotate" and args:
            angle = math.radians(args[0])
            cos_a = math.cos(angle)
            sin_a = math.sin(angle)
            rotation = (cos_a, sin_a, -sin_a, cos_a, 0.0, 0.0)
            if len(args) >= 3:
                cx, cy = args[1], args[2]
                local = multiply_matrix(
                    multiply_matrix((1.0, 0.0, 0.0, 1.0, cx, cy), rotation),
                    (1.0, 0.0, 0.0, 1.0, -cx, -cy),
                )
            else:
                local = rotation

        if local is not None:
            matrix = multiply_matrix(matrix, local)

    return matrix


def transform_point(point: tuple[float, float], matrix: Matrix) -> tuple[float, float]:
    a, b, c, d, e, f = matrix
    x, y = point
    return a * x + c * y + e, b * x + d * y + f


def bbox_from_points(points: Iterable[tuple[float, float]], matrix: Matrix) -> BBox | None:
    transformed = [transform_point(point, matrix) for point in points]
    if not transformed:
        return None
    xs = [point[0] for point in transformed if -100000 < point[0] < 100000]
    ys = [point[1] for point in transformed if -100000 < point[1] < 100000]
    if not xs or not ys:
        return None
    return min(xs), min(ys), max(xs), max(ys)


def path_tokens(value: str | None) -> list[str | float]:
    if not value:
        return []
    tokens: list[str | float] = []
    for command, number in PATH_TOKEN_RE.findall(value):
        tokens.append(command if command else float(number))
    return tokens


def read_path_args(tokens: list[str | float], index: int, count: int) -> tuple[list[float] | None, int]:
    if index + count > len(tokens):
        return None, index
    chunk = tokens[index : index + count]
    if any(isinstance(item, str) for item in chunk):
        return None, index
    return [float(item) for item in chunk], index + count


def path_points(value: str | None) -> list[tuple[float, float]]:
    tokens = path_tokens(value)
    points: list[tuple[float, float]] = []
    index = 0
    command = ""
    current = (0.0, 0.0)
    start = (0.0, 0.0)

    arity = {
        "M": 2,
        "L": 2,
        "T": 2,
        "H": 1,
        "V": 1,
        "C": 6,
        "S": 4,
        "Q": 4,
        "A": 7,
    }

    while index < len(tokens):
        outer_index = index
        token = tokens[index]
        if isinstance(token, str):
            command = token
            index += 1
        elif not command:
            break

        upper = command.upper()
        if upper == "Z":
            current = start
            points.append(current)
            command = ""
            continue

        if upper not in arity:
            break

        first_moveto = upper == "M"
        while index < len(tokens) and not isinstance(tokens[index], str):
            inner_index = index
            args, index_after = read_path_args(tokens, index, arity[upper])
            if args is None:
                if index == inner_index:
                    index += 1
                break
            index = index_after
            relative = command.islower()
            x, y = current

            if upper == "M":
                nx = args[0] + (x if relative else 0.0)
                ny = args[1] + (y if relative else 0.0)
                current = (nx, ny)
                start = current
                points.append(current)
                if first_moveto:
                    first_moveto = False
                    command = "l" if relative else "L"
                    upper = "L"
            elif upper in {"L", "T"}:
                current = (args[0] + (x if relative else 0.0), args[1] + (y if relative else 0.0))
                points.append(current)
            elif upper == "H":
                current = (args[0] + (x if relative else 0.0), y)
                points.append(current)
            elif upper == "V":
                current = (x, args[0] + (y if relative else 0.0))
                points.append(current)
            elif upper == "C":
                raw_points = [(args[0], args[1]), (args[2], args[3]), (args[4], args[5])]
                converted = [(px + (x if relative else 0.0), py + (y if relative else 0.0)) for px, py in raw_points]
                points.extend(converted)
                current = converted[-1]
            elif upper in {"S", "Q"}:
                raw_points = [(args[0], args[1]), (args[2], args[3])]
                converted = [(px + (x if relative else 0.0), py + (y if relative else 0.0)) for px, py in raw_points]
                points.extend(converted)
                current = converted[-1]
            elif upper == "A":
                end = (args[5] + (x if relative else 0.0), args[6] + (y if relative else 0.0))
                points.extend([current, end])
                current = end

        if index == outer_index:
            index += 1

    return points


def path_bbox(element: ET.Element, matrix: Matrix) -> BBox | None:
    return bbox_from_points(path_points(element.attrib.get("d")), matrix)


def parse_float(element: ET.Element, key: str, default: float = 0.0) -> float:
    value = element.attrib.get(key)
    if value is None:
        return default
    numbers = numbers_from(value)
    return numbers[0] if numbers else default


def element_bbox(element: ET.Element, matrix: Matrix) -> BBox | None:
    tag = strip_namespace(element.tag)

    if tag == "path":
        return path_bbox(element, matrix)

    if tag in {"rect", "image", "use"}:
        x = parse_float(element, "x")
        y = parse_float(element, "y")
        width = parse_float(element, "width")
        height = parse_float(element, "height")
        if tag == "use" and (width == 0 or height == 0):
            return bbox_from_points([(x, y)], matrix)
        return bbox_from_points([(x, y), (x + width, y), (x, y + height), (x + width, y + height)], matrix)

    if tag == "circle":
        cx = parse_float(element, "cx")
        cy = parse_float(element, "cy")
        radius = parse_float(element, "r")
        return bbox_from_points([(cx - radius, cy - radius), (cx + radius, cy + radius)], matrix)

    if tag == "ellipse":
        cx = parse_float(element, "cx")
        cy = parse_float(element, "cy")
        rx = parse_float(element, "rx")
        ry = parse_float(element, "ry")
        return bbox_from_points([(cx - rx, cy - ry), (cx + rx, cy + ry)], matrix)

    if tag == "line":
        return bbox_from_points(
            [
                (parse_float(element, "x1"), parse_float(element, "y1")),
                (parse_float(element, "x2"), parse_float(element, "y2")),
            ],
            matrix,
        )

    if tag in {"polyline", "polygon"}:
        values = numbers_from(element.attrib.get("points"))
        return bbox_from_points(list(zip(values[0::2], values[1::2])), matrix)

    return None


def union_bbox(boxes: Iterable[BBox]) -> BBox | None:
    boxes = list(boxes)
    if not boxes:
        return None
    return (
        min(box[0] for box in boxes),
        min(box[1] for box in boxes),
        max(box[2] for box in boxes),
        max(box[3] for box in boxes),
    )


def area(bbox: BBox) -> float:
    return max(0.0, bbox[2] - bbox[0]) * max(0.0, bbox[3] - bbox[1])


def is_white(value: str | None) -> bool:
    if not value:
        return False
    return value.strip().lower() in {"white", "#fff", "#ffffff", "rgb(255,255,255)", "rgb(255 255 255)"}


def is_background(element: ET.Element, bbox: BBox, sheet_bbox: BBox) -> bool:
    sheet_area = max(1.0, area(sheet_bbox))
    element_area = area(bbox)
    return is_white(element.attrib.get("fill")) and element_area / sheet_area > 0.6


def expanded(bbox: BBox, amount: float) -> BBox:
    return bbox[0] - amount, bbox[1] - amount, bbox[2] + amount, bbox[3] + amount


def intersects(a: BBox, b: BBox) -> bool:
    return a[0] <= b[2] and a[2] >= b[0] and a[1] <= b[3] and a[3] >= b[1]


def collect_leaves(root: ET.Element, sheet_bbox: BBox) -> list[Leaf]:
    leaves: list[Leaf] = []

    def walk(element: ET.Element, parent_matrix: Matrix) -> None:
        tag = strip_namespace(element.tag)
        if tag in STRUCTURAL_TAGS:
            return

        matrix = multiply_matrix(parent_matrix, parse_transform(element.attrib.get("transform")))
        if tag in GRAPHIC_TAGS:
            bbox = element_bbox(element, matrix)
            if bbox is not None and not is_background(element, bbox, sheet_bbox):
                leaves.append(Leaf(bbox=bbox))
            return

        for child in list(element):
            walk(child, matrix)

    walk(root, (1.0, 0.0, 0.0, 1.0, 0.0, 0.0))
    return leaves


class DisjointSet:
    def __init__(self, size: int) -> None:
        self.parent = list(range(size))

    def find(self, item: int) -> int:
        while self.parent[item] != item:
            self.parent[item] = self.parent[self.parent[item]]
            item = self.parent[item]
        return item

    def union(self, left: int, right: int) -> None:
        left_root = self.find(left)
        right_root = self.find(right)
        if left_root != right_root:
            self.parent[right_root] = left_root


def cluster_leaf_groups(leaves: list[Leaf], gap: float) -> list[list[BBox]]:
    dsu = DisjointSet(len(leaves))
    expanded_boxes = [expanded(leaf.bbox, gap / 2.0) for leaf in leaves]
    order = sorted(range(len(expanded_boxes)), key=lambda item: expanded_boxes[item][0])

    for position, index in enumerate(order):
        bbox = expanded_boxes[index]
        for other_index in order[position + 1 :]:
            other_bbox = expanded_boxes[other_index]
            if other_bbox[0] > bbox[2]:
                break
            if intersects(bbox, other_bbox):
                dsu.union(index, other_index)

    grouped: dict[int, list[BBox]] = {}
    for index, leaf in enumerate(leaves):
        grouped.setdefault(dsu.find(index), []).append(leaf.bbox)

    return list(grouped.values())


def cluster_leaves(leaves: list[Leaf], gap: float) -> list[BBox]:
    return [box for box in (union_bbox(items) for items in cluster_leaf_groups(leaves, gap)) if box is not None]


def get_sheet_bbox(root: ET.Element) -> BBox:
    view_box = numbers_from(root.attrib.get("viewBox"))
    if len(view_box) >= 4:
        x, y, width, height = view_box[:4]
        return x, y, x + width, y + height
    return 0.0, 0.0, parse_float(root, "width"), parse_float(root, "height")


def bbox_width(bbox: BBox) -> float:
    return bbox[2] - bbox[0]


def bbox_height(bbox: BBox) -> float:
    return bbox[3] - bbox[1]


def bbox_center(bbox: BBox, axis: int) -> float:
    if axis == 0:
        return (bbox[0] + bbox[2]) / 2.0
    return (bbox[1] + bbox[3]) / 2.0


def split_group_by_anchors(group: list[BBox], settings: dict[str, float]) -> list[BBox]:
    bbox = union_bbox(group)
    if bbox is None:
        return []

    anchor_area = settings.get("anchor_area", 0.0)
    anchor_gap = settings.get("anchor_gap", 999999.0)
    anchors = [
        item
        for item in group
        if area(item) >= anchor_area and bbox_width(item) >= 120 and bbox_height(item) >= 90
    ]
    if len(anchors) < 2:
        return [bbox]

    best: tuple[float, int, float] | None = None
    for axis in (0, 1):
        centers = sorted(bbox_center(anchor, axis) for anchor in anchors)
        for index in range(len(centers) - 1):
            gap = centers[index + 1] - centers[index]
            if gap >= anchor_gap and (best is None or gap > best[0]):
                best = (gap, axis, (centers[index] + centers[index + 1]) / 2.0)

    if best is None:
        return [bbox]

    _, axis, split_at = best
    left = [item for item in group if bbox_center(item, axis) <= split_at]
    right = [item for item in group if bbox_center(item, axis) > split_at]
    if not left or not right:
        return [bbox]

    return split_group_by_anchors(left, settings) + split_group_by_anchors(right, settings)


def split_leaf_groups(groups: list[list[BBox]], settings: dict[str, float]) -> list[BBox]:
    clusters: list[BBox] = []
    for group in groups:
        clusters.extend(split_group_by_anchors(group, settings))
    return clusters


def significant_clusters(clusters: list[BBox], settings: dict[str, float]) -> list[BBox]:
    min_area = settings["min_area"]
    min_side = settings["min_side"]
    kept = [
        bbox
        for bbox in clusters
        if area(bbox) >= min_area and max(bbox[2] - bbox[0], bbox[3] - bbox[1]) >= min_side
        and not is_sheet_label_cluster(bbox)
    ]
    return sorted(kept, key=lambda b: (round((b[1] + b[3]) / 80.0), b[0], b[1]))


def is_sheet_label_cluster(bbox: BBox) -> bool:
    width = bbox[2] - bbox[0]
    height = bbox[3] - bbox[1]
    return bbox[1] < 70 and width < 220 and height < 70


def extract_matching(element: ET.Element, selection: BBox, parent_matrix: Matrix, sheet_bbox: BBox) -> ET.Element | None:
    tag = strip_namespace(element.tag)
    if tag in STRUCTURAL_TAGS:
        return None

    matrix = multiply_matrix(parent_matrix, parse_transform(element.attrib.get("transform")))
    if tag in GRAPHIC_TAGS:
        bbox = element_bbox(element, matrix)
        if bbox is not None and not is_background(element, bbox, sheet_bbox) and intersects(bbox, selection):
            return copy.deepcopy(element)
        return None

    if tag in CONTAINER_TAGS:
        kept_children = []
        for child in list(element):
            kept = extract_matching(child, selection, matrix, sheet_bbox)
            if kept is not None:
                kept_children.append(kept)
        if not kept_children:
            return None
        group = ET.Element(element.tag, element.attrib)
        for child in kept_children:
            group.append(child)
        return group

    return None


def id_index(root: ET.Element) -> dict[str, ET.Element]:
    indexed: dict[str, ET.Element] = {}
    for element in root.iter():
        element_id = element.attrib.get("id")
        if element_id:
            indexed[element_id] = element
    return indexed


def refs_from(element: ET.Element) -> set[str]:
    refs: set[str] = set()
    for key, value in element.attrib.items():
        refs.update(URL_REF_RE.findall(value))
        if key in HREF_ATTRS and value.startswith("#"):
            refs.add(value[1:])
    return refs


def referenced_defs(output: ET.Element, source_root: ET.Element) -> ET.Element | None:
    indexed = id_index(source_root)
    seen: set[str] = set()
    pending: list[str] = []

    for element in output.iter():
        pending.extend(refs_from(element))

    refs: list[str] = []
    while pending:
        ref = pending.pop()
        if ref in seen or ref not in indexed:
            continue
        seen.add(ref)
        refs.append(ref)
        pending.extend(refs_from(indexed[ref]))
        for child in indexed[ref].iter():
            pending.extend(refs_from(child))

    if not refs:
        return None

    defs = ET.Element(f"{{{SVG_NS}}}defs")
    for ref in refs:
        defs.append(copy.deepcopy(indexed[ref]))
    return defs


def make_svg(source_root: ET.Element, selection: BBox, padded_view_box: BBox, sheet_bbox: BBox) -> ET.Element:
    x1, y1, x2, y2 = padded_view_box
    width = max(1.0, x2 - x1)
    height = max(1.0, y2 - y1)
    output = ET.Element(
        f"{{{SVG_NS}}}svg",
        {
            "width": f"{width:.2f}".rstrip("0").rstrip("."),
            "height": f"{height:.2f}".rstrip("0").rstrip("."),
            "viewBox": f"{x1:.2f} {y1:.2f} {width:.2f} {height:.2f}",
            "fill": "none",
        },
    )

    kept = []
    for child in list(source_root):
        extracted = extract_matching(child, selection, (1.0, 0.0, 0.0, 1.0, 0.0, 0.0), sheet_bbox)
        if extracted is not None:
            kept.append(extracted)

    for item in kept:
        output.append(item)

    defs = referenced_defs(output, source_root)
    if defs is not None:
        output.insert(0, defs)

    return output


def safe_category_name(path: Path) -> str:
    return path.stem.replace("/", "_").replace("\\", "_").strip()


def uses_descriptive_names(category: str) -> bool:
    return category == "Иконки"


def asset_filename(category: str, index: int, bbox: BBox, counters: dict[str, int]) -> str:
    names = DESCRIPTIVE_NAMES.get(category, []) if uses_descriptive_names(category) else []
    if index <= len(names):
        return f"{names[index - 1]}.svg"

    if category == "Иконки":
        prefix = "иконка"
    elif category == "Стиль Английский":
        prefix = "английская_локация" if bbox_width(bbox) > 280 and bbox_height(bbox) > 220 else "английский_объект"
    elif category == "Стиль Музыка":
        prefix = "музыкальная_сцена" if bbox_width(bbox) > 320 or bbox_height(bbox) > 260 else "музыкальный_объект"
    elif category == "Стиль Учи.ру_завры":
        prefix = "динозавровая_локация" if bbox_width(bbox) > 340 and bbox_height(bbox) > 230 else "динозавровый_объект"
    elif category == "Стиль Учи.ру_люди":
        if bbox_width(bbox) > 330 and bbox_height(bbox) > 220:
            prefix = "сцена_с_людьми"
        elif bbox_height(bbox) > 250:
            prefix = "персонаж"
        else:
            prefix = "объект_люди"
    elif category == "Стиль Чумовая ферма":
        prefix = "фермерская_локация" if bbox_width(bbox) > 330 and bbox_height(bbox) > 220 else "фермерский_объект"
    else:
        prefix = "ассет"

    counters[prefix] = counters.get(prefix, 0) + 1
    generated = f"{prefix}_{counters[prefix]:02}.svg"
    return SEMANTIC_FILE_NAMES.get(category, {}).get(generated, generated)


def extract_source(path: Path) -> list[dict[str, object]]:
    category = safe_category_name(path)
    settings = CATEGORY_SETTINGS.get(category, CATEGORY_SETTINGS["default"])
    category_dir = OUT_DIR / category
    category_dir.mkdir(parents=True, exist_ok=True)
    for stale_svg in category_dir.glob("*.svg"):
        stale_svg.unlink()

    tree = ET.parse(path)
    root = tree.getroot()
    sheet_bbox = get_sheet_bbox(root)
    leaves = collect_leaves(root, sheet_bbox)
    leaf_groups = cluster_leaf_groups(leaves, settings["gap"])
    clusters = significant_clusters(split_leaf_groups(leaf_groups, settings), settings)

    manifest_items: list[dict[str, object]] = []
    counters: dict[str, int] = {}
    for index, selection in enumerate(clusters, start=1):
        padded = expanded(selection, settings["padding"])
        output = make_svg(root, selection, padded, sheet_bbox)
        filename = asset_filename(category, index, selection, counters)
        ET.ElementTree(output).write(category_dir / filename, encoding="utf-8", xml_declaration=False)
        manifest_items.append(
            {
                "file": f"{category}/{filename}",
                "name": filename.removesuffix(".svg"),
                "source": path.name,
                "viewBox": [round(padded[0], 2), round(padded[1], 2), round(padded[2] - padded[0], 2), round(padded[3] - padded[1], 2)],
            }
        )

    return manifest_items


def write_readme(items_by_category: dict[str, list[dict[str, object]]]) -> None:
    lines = [
        "# Разделенные ассеты",
        "",
        "Эта папка сгенерирована из SVG-паков в `assets/` скриптом `tools/extract_svg_assets.py`.",
        "Каждый файл содержит один геометрический кластер с прозрачным фоном и понятным именем по содержимому.",
        "",
        "Белый листовой фон исходных паков не переносится. Белые детали самих ассетов, например блики, зубы, глаза и текстуры, остаются внутри SVG.",
        "",
        "## Категории",
        "",
    ]

    for category, items in sorted(items_by_category.items()):
        lines.append(f"- `{category}/`: {len(items)} SVG")

    lines.extend(
        [
            "",
            "Подробный список файлов и viewBox лежит в `manifest.json`.",
            "",
        ]
    )
    (OUT_DIR / "README.md").write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    items_by_category: dict[str, list[dict[str, object]]] = {}

    for source in sorted(SOURCE_DIR.glob("*.svg"), key=lambda item: item.name):
        items_by_category[safe_category_name(source)] = extract_source(source)

    manifest = {
        "output": str(OUT_DIR.relative_to(ROOT)).replace("\\", "/"),
        "categories": items_by_category,
    }
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    write_readme(items_by_category)

    total = sum(len(items) for items in items_by_category.values())
    print(f"Extracted {total} SVG assets into {OUT_DIR}")
    for category, items in sorted(items_by_category.items()):
        print(f"- {category}: {len(items)}")


if __name__ == "__main__":
    main()
