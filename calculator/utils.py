import os
import json
from typing import Any, List, Union, Dict, Tuple


def read_help(help_dir: str, tree: Dict[str, Any]) -> None:
    if tree['values']:
        for k in tree['values']:
            tree['values'][k]['help'] = open(
                    os.path.join(help_dir, tree['values'][k]['help']), 'r', encoding='utf-8'
                ).read()
            read_help(help_dir, tree['values'][k])


class Calculator:
    def __init__(self, area: float, height: float, selection_list: List[str]) -> None:
        self.adhesive_unit_price = 24
        self.neoprene_unit_price = 1.65
        self.silver_tape_unit_price = 2
        self.caps_unit_price = 0.11
        self.truck_max_fill = 500
        self.truck_max_fill_price = 500

        self.panel_len = 0.6
        self.panel_hight = 30
        self.neoprene_roll_len = 10
        self.silver_tape_roll_len = 45
        self.room_sides_ratio = 0.007
        
        self.area = area
        self.height = height

        curr_dir = os.path.dirname(os.path.abspath(__file__))
        materials_dir = os.path.join(curr_dir, 'materials')
        
        tree_path = os.path.join(materials_dir, 'tree.json')
        with open(tree_path, 'r') as f:
            tree = json.load(f)
        self.tree = tree

        price_path = os.path.join(materials_dir, 'price.json')
        with open(price_path, 'r') as f:
            price = json.load(f)
        self.price = price
        
        self.filters = {}
        for k in selection_list:
            self.filters[tree['filter_name']] = k
            tree = tree['values'][k]

    def get_height_range(self) -> Tuple[float, float]:
        specification = self.filters['specification']

        heights = []
        for  k in self.price['specification'][specification]['price']:
            h = k.split('-')
            heights.append(float(h[0]))
            heights.append(float(h[1]))
        
        max_h = max(heights) + self.panel_hight
        min_h = min(heights) + self.panel_hight
        
        return (min_h, max_h)
    
    def humanize_filters(self) -> Dict[str, str]:
        filters_humanized = {}
        for k, v in self.filters.items():
            k = k.replace('_', ' ').capitalize()
            v = v.replace('_', ' ')
            if not v[0].isupper():
                v = v.capitalize()
            filters_humanized[k] = v
        
        return filters_humanized
    
    def get_profit_factor(self) -> float:
        profit_f = 1.25
        if self.filters['specification'] in self.price['specification']:
            profit_f = self.price['specification'][self.filters['specification']]['profit_factor']

        return profit_f

    def get_panel_factor(self) -> float:
        factor = 2.9
        if 'brand' in self.filters:
            factor = self.price['brand'][self.filters['brand']]['factor']
        
        return factor
    
    def calculate_panel_price(self) -> List[float]:
        if 'brand' in self.filters:
            min_price_per_plate = self.price['brand'][self.filters['brand']]['price']['min']
            max_price_per_plate = self.price['brand'][self.filters['brand']]['price']['max']
            factor = self.price['brand'][self.filters['brand']]['factor']
        else:
            min_price_per_plate = 4.5
            max_price_per_plate = None
            factor = 2.9
        
        res = []
        res.append(min_price_per_plate * factor * self.area)
        if max_price_per_plate:
            res.append(max_price_per_plate * factor * self.area)
        
        return res
    
    def calculate_pedestal_qnt(self) -> float:
        specification = 'BSEN'
        if self.filters['specification'] in self.price['specification']:
            specification = self.filters['specification']
        
        factor = self.price['specification'][specification]['factor']

        return factor * self.area
    
    def calculate_panel_qnt(self) -> float:
        if 'brand' in self.filters:
            factor = self.price['brand'][self.filters['brand']]['factor']
        else:
            factor = 2.9
        
        return self.area * factor
    
    def calculate_pedestal_price(self) -> float:
        specification = 'BSEN'
        if self.filters['specification'] in self.price['specification']:
            specification = self.filters['specification']
        
        pedestal_h = self.height - self.panel_hight
        for h_range in self.price['specification'][specification]['price']:
            min_h, max_h = [float(h) for h in h_range.split('-')]
            if min_h <= pedestal_h <= max_h:
                pedestal_selection = h_range
                break
            
        price_per_pedestal = self.price['specification'][specification]['price'][pedestal_selection]['price']
        factor = self.price['specification'][specification]['factor']

        return price_per_pedestal * factor * self.area

    def calculate_caps_price(self):
        return self.calculate_pedestal_qnt() * self.caps_unit_price

    def calculate_adhesive_price(self) -> float:
        return self.calculate_pedestal_qnt() * self.adhesive_unit_price / 200

    def calculate_neoprene_price(self) -> float:
        perimeter = pow(self.area / self.room_sides_ratio, 0.5) * 2 * (1 + self.room_sides_ratio)
        roll_qnt = perimeter / self.neoprene_roll_len
        
        return roll_qnt * self.neoprene_unit_price
    
    def calculate_silver_tape_price(self) -> float:
        panel_qnt = self.calculate_panel_qnt()

        return self.get_panel_factor() * self.area * self.panel_len * self.silver_tape_unit_price / self.silver_tape_roll_len

    def calculate_labor_price(self) -> float:
        labor_unit_price = 12
        if self.area < 50:
            labor_unit_price = 12
        elif self.area <= 75:
            labor_unit_price = 9.5
        elif self.area <= 100:
            labor_unit_price = 8
        elif self.area <= 150:
            labor_unit_price = 7
        elif self.area <= 200:
            labor_unit_price = 6
        elif self.area <= 500:
            labor_unit_price = 5
        else:
            labor_unit_price = 4.5
        
        return self.area * labor_unit_price
    
    def calculate_delivery_price(self) -> float:
        full, rem = divmod(self.area, self.truck_max_fill)
        
        res = full * self.truck_max_fill_price
        if rem <= 50:
            res += 150
        elif rem <= 100:
            res += 250
        elif rem <= 200:
            res += 400
        else:
            res += 500
        
        return res
    
    def calculate(self) -> Dict[str, Any]:
        profit_f = self.get_profit_factor()
        supply_only = 0

        pedestal_price = self.calculate_pedestal_price() * profit_f
        supply_only += pedestal_price

        adhesive_price = self.calculate_adhesive_price() * profit_f
        supply_only += adhesive_price

        neoprene_price = self.calculate_neoprene_price() * profit_f
        supply_only += neoprene_price

        silver_tape_price = self.calculate_silver_tape_price() * profit_f
        supply_only += silver_tape_price

        caps_price = self.calculate_caps_price() * profit_f
        supply_only += caps_price

        delivery_price = self.calculate_delivery_price() * profit_f
        supply_only += delivery_price
        
        panel_price = [pp * profit_f for pp in self.calculate_panel_price()]
        supply_only = [pp + supply_only for pp in panel_price]

        labor_price = self.calculate_labor_price() * profit_f
        supply_install = [so + labor_price for so in supply_only]

        price_per_m2_supp_only = [so / self.area for so in supply_only]
        price_per_m2_supp_inst = [si / self.area for si in supply_install]

        res =  {
            'panel_price': f'{panel_price[0]:.2f} - {panel_price[1]:.2f}' if len(panel_price) > 1 else f'{panel_price[0]:.2f}',
            'pedestal_price': '{:.2f}'.format(pedestal_price),
            'adhesive_price': '{:.2f}'.format(adhesive_price),
            'neoprene_price': '{:.2f}'.format(neoprene_price),
            'silver_tape_price': '{:.2f}'.format(silver_tape_price),
            'caps_price': '{:.2f}'.format(caps_price),
            'labor_price': '{:.2f}'.format(labor_price),
            'delivery_price': '{:.2f}'.format(delivery_price),
            'supply_only': f'{supply_only[0]:.2f} - {supply_only[1]:.2f}' if len(supply_only) > 1 else f'{supply_only[0]:.2f}',
            'supply_install': f'{supply_install[0]:.2f} - {supply_install[1]:.2f}' if len(supply_install) > 1 else f'{supply_install[0]:.2f}',
            'price_per_m2_supp_only': f'{price_per_m2_supp_only[0]:.2f} - {price_per_m2_supp_only[1]:.2f}' if len(price_per_m2_supp_only) > 1 else f'{price_per_m2_supp_only[0]:.2f}',
            'price_per_m2_supp_inst': f'{price_per_m2_supp_inst[0]:.2f} - {price_per_m2_supp_inst[1]:.2f}' if len(supply_install) > 1 else f'{price_per_m2_supp_inst[0]:.2f}',
        }

        return res
