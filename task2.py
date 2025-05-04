import datetime
import calendar

def get_birthdate():
    day = int(input("Введите день рождения (1-31): "))
    month = int(input("Введите месяц рождения (1-12): "))
    year = int(input("Введите год рождения: "))
    return day, month, year

def get_weekday(day, month, year):
    date = datetime.date(year, month, day)
    weekdays = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"]
    return weekdays[date.weekday()]

def is_leap_year(year):
    return calendar.isleap(year)

def calculate_age(day, month, year):
    today = datetime.date.today()
    age = today.year - year - ((today.month, today.day) < (month, day))
    return age

def print_star_digits(number):
    digits = {
        '0': [" *** ", "*   *", "*   *", "*   *", " *** "],
        '1': ["  *  ", " **  ", "  *  ", "  *  ", " *** "],
        '2': [" *** ", "    *", " *** ", "*    ", " *** "],
        '3': [" *** ", "    *", " *** ", "    *", " *** "],
        '4': ["*   *", "*   *", " *** ", "    *", "    *"],
        '5': [" *** ", "*    ", " *** ", "    *", " *** "],
        '6': [" *** ", "*    ", " *** ", "*   *", " *** "],
        '7': [" *** ", "    *", "   * ", "  *  ", " *   "],
        '8': [" *** ", "*   *", " *** ", "*   *", " *** "],
        '9': [" *** ", "*   *", " *** ", "    *", " *** "]
    }
    lines = ["" for _ in range(5)]
    for digit in str(number):
        for i in range(5):
            lines[i] += digits[digit][i] + "  "
    return "\n".join(lines)

def main():
    day, month, year = get_birthdate()
    print(f"Вы родились в {get_weekday(day, month, year)}")
    print(f"Год {year} {'високосный' if is_leap_year(year) else 'не високосный'}")
    print(f"Ваш возраст: {calculate_age(day, month, year)} лет")
    print("Дата рождения в формате дд мм гггг:")
    print(print_star_digits(f"{day:02}{month:02}{year}"))

if __name__ == "__main__":
    main()