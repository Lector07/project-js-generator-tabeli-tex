/**
 * @file script-generator.js
 * @description Skrypt do generowania tabel w formacie LaTeX oraz renderowania ich podglądów.
 *
 * Ten skrypt umożliwia użytkownikowi generowanie tabel w formacie LaTeX na podstawie parametrów wprowadzonych w formularzu.
 *
 * Dodatkowo, skrypt oferuje podgląd tabeli w formacie LaTeX (za pomocą MathJax).
 *
 * Zapewnia również funkcje kopiowania wygenerowanego kodu, resetowania formularza, pobierania kodu jako pliku .tex,
 * automatycznego zapisu i ładowania ustawień z localStorage.
 *
 * @author [Jakub Jonarski]
 *
 * @global
 */

document.addEventListener("DOMContentLoaded", () => {
    /**
     * Formularz HTML używany do zbierania danych wejściowych potrzebnych do generowania tabeli LaTeX.
     * @type {HTMLFormElement}
     * @constant
     * @global
     */
    const form = document.getElementById("tableForm");

    /**
     * Przycisk generowania tabeli.
     * @type {HTMLButtonElement}
     * @constant
     * @global
     */
    const generateBtn = document.getElementById("generateBtn");

    /**
     * Przycisk kopiowania wygenerowanego kodu LaTeX do schowka.
     * @type {HTMLButtonElement}
     * @constant
     * @global
     */
    const copyBtn = document.getElementById("copyBtn");

    /**
     * Przycisk resetowania formularza do wartości domyślnych.
     * @type {HTMLButtonElement}
     * @constant
     * @global
     */
    const resetBtn = document.getElementById("resetBtn");

    /**
     * Przycisk pobierania wygenerowanego kodu LaTeX jako plik .tex.
     * @type {HTMLButtonElement}
     * @constant
     * @global
     */
    const downloadBtn = document.getElementById("downloadBtn");

    /**
     * Pole tekstowe, w którym wyświetlany jest wygenerowany kod LaTeX.
     * @type {HTMLTextAreaElement}
     * @constant
     * @global
     */
    const output = document.getElementById("output");

    /**
     * Element, w którym renderowany jest podgląd tabeli w formacie LaTeX.
     * @type {HTMLElement}
     * @constant
     * @global
     */
    const tablePreview = document.getElementById("tablePreview");

    /**
     * Liczba wierszy tabeli pobrana z formularza.
     * @type {number}
     * @global
     */
    let rows;

    /**
     * Liczba kolumn tabeli pobrana z formularza.
     * @type {number}
     * @global
     */
    let columns;

    /**
     * Styl obramowania tabeli pobrany z formularza.
     * @type {string}
     * @global
     */
    let style;

    /**
     * Określa, czy tabela ma nagłówek pobrane z formularza.
     * @type {boolean}
     * @global
     */
    let hasHeader;

    /**
     * Określa, czy wiersze mają być automatycznie numerowane pobrane z formularza.
     * @type {boolean}
     * @global
     */
    let autoNumber;

    /**
     * Styl czcionki pobrany z formularza
     * @type {string}
     * @global
     */
    let fontStyle;

    /**
     * Określa, czy komórki mają być traktowane jako numeryczne i wyświetlać mapę ciepła
     * @type {boolean}
     * @global
     */
    let isNumeric;


    /**
     * Maksymalna liczba wierszy do podglądu (ograniczenie dla podglądu).
     * @type {number}
     * @global
     */
    let previewRows;

    /**
     * Maksymalna liczba kolumn do podglądu (ograniczenie dla podglądu).
     * @type {number}
     * @global
     */
    let previewColumns;

    /**
     * Całkowita liczba kolumn (z uwzględnieniem numeracji wierszy).
     * @type {number}
     * @global
     */
    let totalColumns;

    /**
     * Całkowita liczba kolumn w podglądzie (z uwzględnieniem numeracji wierszy).
     * @type {number}
     * @global
     */
    let totalPreviewColumns;

    /**
     * Wygenerowany kod LaTeX dla tabeli.
     * @type {string}
     * @global
     */
    let latexOutput;

    /**
     * Wygenerowany kod LaTeX dla podglądu tabeli.
     * @type {string}
     * @global
     */
    let latexPreview;

    /**
     * Funkcja dodająca style tekstu do komórki tabeli.
     * @param {string} text Tekst komórki.
     * @param {string} fontStyle Styl czcionki do zastosowania.
     * @returns {string} Tekst z zastosowanymi stylami LaTeX.
     */
    function applyFontStyle(text, fontStyle) {
        let styledText = text;
        switch (fontStyle) {
            case "bold":
                styledText = `\\textbf{${styledText}}`;
                break;
            default:
                break;
        }
        return styledText;
    }

    /**
     * Funkcja generująca losową wartość w zakresie od 0 do 1 z dokładnością do 4 miejsc po przecinku.
     * @returns {number} Losowa wartość.
     */
    function generateRandomValue() {
        return parseFloat((Math.random()).toFixed(4));
    }

    /**
     * Obsługuje kliknięcie przycisku generowania tabeli. Pobiera wartości z formularza, generuje kod LaTeX tabeli,
     * renderuje podgląd i zapisuje ustawienia.
     * @event click
     * @fires generateTable
     * @listens click
     */
    generateBtn.addEventListener("click", () => {
        /**
         * Liczba wierszy tabeli.
         * @type {number}
         */
        rows = parseInt(document.getElementById("rows").value);

        /**
         * Liczba kolumn tabeli.
         * @type {number}
         */
        columns = parseInt(document.getElementById("columns").value);

        /**
         * Styl obramowania tabeli.
         * @type {string}
         */
        style = document.getElementById("style").value;

        /**
         * Określa, czy tabela ma nagłówek.
         * @type {boolean}
         */
        hasHeader = document.getElementById("header").checked;

        /**
         * Określa, czy wiersze mają być automatycznie numerowane.
         * @type {boolean}
         */
        autoNumber = document.getElementById("autoNumber").checked;

        /**
         * Styl czcionki
         * @type {string}
         */
        fontStyle = document.getElementById("fontStyle").value;

        /**
         * Określa, czy komórki mają być traktowane jako numeryczne i wyświetlać mapę ciepła
         * @type {boolean}
         */
        isNumeric = document.getElementById("isNumeric").checked;


        // Walidacja formularza
        if (isNaN(rows) || isNaN(columns) || rows <= 0 || columns <= 0) {
            alert("Proszę wprowadzić prawidłową liczbę wierszy i kolumn.");
            return;
        }

        /**
         * Maksymalna liczba wierszy do podglądu (ograniczenie dla podglądu).
         * @type {number}
         */
        previewRows = Math.min(rows, 5);
        /**
         * Maksymalna liczba kolumn do podglądu (ograniczenie dla podglądu).
         * @type {number}
         */
        previewColumns = Math.min(columns, 5);

        /**
         * Całkowita liczba kolumn (z uwzględnieniem numeracji wierszy).
         * @type {number}
         */
        totalColumns = autoNumber ? columns + 1 : columns;
        /**
         * Całkowita liczba kolumn w podglądzie (z uwzględnieniem numeracji wierszy).
         * @type {number}
         */
        totalPreviewColumns = autoNumber ? previewColumns + 1 : previewColumns;


        /**
         * Wygenerowany kod LaTeX dla tabeli.
         * @type {string}
         */
        latexOutput = "\\begin{tabular}{";
        /**
         * Wygenerowany kod LaTeX dla podglądu tabeli.
         * @type {string}
         */
        latexPreview = "\\begin{array}{"; // Use array for MathJax


        // Dodaj styl tabeli
        switch (style) {
            case "full":
                latexOutput += `|${'c|'.repeat(totalColumns)}}\n\\hline\n`;
                latexPreview += `|${'c|'.repeat(totalPreviewColumns)}}\n\\hline\n`;
                break;
            case "horizontal":
                latexOutput += autoNumber ? `c|${'c '.repeat(totalColumns - 1)}}\n` : `${'c '.repeat(totalColumns)}}\n`;
                latexPreview += autoNumber ? `c|${'c '.repeat(totalPreviewColumns - 1)}}\n` : `${'c '.repeat(totalPreviewColumns)}}\n`;
                break;
            default:
                latexOutput += `${'c '.repeat(totalColumns)}}\n`;
                latexPreview += `${'c '.repeat(totalPreviewColumns)}}\n`;
                break;
        }

        // Dodaj nagłówek, jeśli zaznaczono
        if (hasHeader) {
            if (autoNumber) {
                latexOutput += applyFontStyle("Numer wiersza", fontStyle) + " & ";
                latexPreview += applyFontStyle("Numer wiersza", fontStyle) + " & ";
            }
            /**
             * Nagłówki kolumn w kodzie LaTeX.
             * @type {string}
             */
            const headers = Array.from({ length: columns }, (_, i) =>
                applyFontStyle(`Nagłówek ${i + 1}`, fontStyle)
            ).join(" & ");
            /**
             * Nagłówki kolumn w podglądzie LaTeX.
             * @type {string}
             */
            const previewHeaders = Array.from({ length: previewColumns }, (_, i) =>
                applyFontStyle(`Nagłówek ${i + 1}`, fontStyle)
            ).join(" & ");

            latexOutput += headers + " \\\\\n";
            latexPreview += previewHeaders + " \\\\\n";

            if (style !== "none") {
                latexOutput += "\\hline\n";
                latexPreview += "\\hline\n";
            }
        }

        // Dodaj wiersze
        for (let i = 1; i <= rows; i++) {
            /**
             * Wiersz tabeli w kodzie LaTeX (z numeracją jeśli włączona).
             * @type {string}
             */
            let rowOutput = autoNumber ? `${applyFontStyle(i.toString(), fontStyle)} & ` : "";
            /**
             * Wiersz tabeli w podglądzie LaTeX (z numeracją jeśli włączona).
             * @type {string}
             */
            let rowPreview = autoNumber ? `${applyFontStyle(i.toString(), fontStyle)} & ` : "";

            // Generowanie danych dla wiersza
            for (let j = 0; j < columns; j++) {
                let value = isNumeric ? generateRandomValue() : `Kolumna${j + 1}`;
                let cellText = value.toString();
                rowOutput += applyFontStyle(cellText, fontStyle) + (j < columns - 1 ? " & " : "");
                if (j < previewColumns) {
                    rowPreview += applyFontStyle(cellText, fontStyle) + (j < previewColumns - 1 ? " & " : "");
                }
            }
            latexOutput += rowOutput + " \\\\\n";
            if (i <= previewRows) latexPreview += rowPreview + " \\\\\n";
            if (style === "horizontal" && i < rows) {
                latexOutput += "\\hline\n";
                if (i < previewRows) latexPreview += "\\hline\n";
            }
            if (style === "full" && i < rows) {
                latexOutput += "\\hline\n";
                if (i < previewRows) latexPreview += "\\hline\n";
            }
        }

        // Dodaj końcową linię dla stylu "full"
        if (style === "full") {
            latexOutput += "\\hline\n";
            latexPreview += "\\hline\n";
        }

        // Zakończ tabelę
        latexOutput += "\\end{tabular}";
        latexPreview += "\\end{array}";

        // Wyświetl kod LaTeX
        output.value = latexOutput;

        // Renderuj podgląd tabeli
        renderTablePreview(latexPreview);
    });

    /**
     * Obsługuje kliknięcie przycisku kopiowania. Kopiuje wygenerowany kod LaTeX do schowka.
     * @event click
     * @fires copyToClipboard
     * @listens click
     */
    copyBtn.addEventListener("click", () => {
        output.select();
        document.execCommand("copy");
        alert("Skopiowano wygenerowany kod w formacie TeX.");
    });

    /**
     * Obsługuje kliknięcie przycisku resetowania formularza. Resetuje formularz, czyści podglądy i pole wyjściowe.
     * @event click
     * @fires resetForm
     * @listens click
     */
    resetBtn.addEventListener("click", () => {
        form.reset();
        tablePreview.innerHTML = "";
        output.value = "";
    });

    /**
     * Obsługuje kliknięcie przycisku pobierania kodu LaTeX. Pobiera wygenerowany kod LaTeX jako plik .tex.
     * @event click
     * @fires downloadTexFile
     * @listens click
     */
    downloadBtn.addEventListener("click", () => {
        const blob = new Blob([output.value], { type: "text/plain;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "table.tex";
        link.click();
    });


    /**
     * Renderuje podgląd tabeli w formacie LaTeX przy użyciu MathJax.
     * @param {string} latex Kod LaTeX do renderowania.
     */
    function renderTablePreview(latex) {
        tablePreview.innerHTML = "";
        const latexContainer = document.createElement("div");
        latexContainer.innerHTML = `\\(${latex}\\)`;
        tablePreview.appendChild(latexContainer);
        MathJax.typesetPromise([latexContainer]);
    }

    /**
     * Zapisuje ustawienia tabeli do localStorage.
     */
    function saveSettings() {
        const settings = {
            rows: document.getElementById("rows").value,
            columns: document.getElementById("columns").value,
            style: document.getElementById("style").value,
            hasHeader: document.getElementById("header").checked,
            autoNumber: document.getElementById("autoNumber").checked,
            fontStyle: document.getElementById("fontStyle").value,
            isNumeric: document.getElementById("isNumeric").checked
        };
        localStorage.setItem("tableSettings", JSON.stringify(settings));
    }

    /**
     * Ładuje ustawienia tabeli z localStorage.
     */
    function loadSettings() {
        const settings = JSON.parse(localStorage.getItem("tableSettings"));
        if (settings) {
            document.getElementById("rows").value = settings.rows;
            document.getElementById("columns").value = settings.columns;
            document.getElementById("style").value = settings.style;
            document.getElementById("header").checked = settings.hasHeader;
            document.getElementById("autoNumber").checked = settings.autoNumber;
            document.getElementById("fontStyle").value = settings.fontStyle;
            document.getElementById("isNumeric").checked = settings.isNumeric;
        }
    }

    // Załaduj ustawienia przy starcie
    window.addEventListener("load", loadSettings);

    // Zapisz ustawienia po kliknięciu przycisku generowania
    generateBtn.addEventListener("click", saveSettings);
});