// Zeichnung des Behringer X-Touch nach der Original-Vorlage (Lage, Gruppen, Beschriftung),
// gefüllt mit dem Live-Abbild (/api/surface) bzw. der Tastenbelegung (/api/keys).
// drawXTouch(svg, L, { interactive, selected }) – L: { device?, keys, help?, shiftHeld?, layer?, send?, recRow? }
(function () {
	const XC = ["#26272b", "#d9443a", "#3fa860", "#d8c23a", "#3b6fd4", "#c34ad0", "#35b8c4", "#e4e4e8"];
	const LIGHT = new Set([2, 3, 6, 7]);
	const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
	const R = (x, y, w, h, f, s, rx = 5, ex = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}"${s ? ` stroke="${s}"` : ""} ${ex}/>`;
	const T = (x, y, t, sz, f, a = "middle", w = 500, cls = "") => `<text x="${x}" y="${y}" font-size="${sz}" fill="${f}" text-anchor="${a}" font-weight="${w}"${cls ? ` class="${cls}"` : ""}>${esc(t)}</text>`;
	const SX = (i) => 447 + i * 120.3; // Mitte der Kanalzüge
	const FY = (pos) => 1205 - (pos / 16383) * 410; // Faderknopf-Mitte
	const SCALE = [[10, 16383], [5, 14684], [0, 12528], [-5, 10268], [-10, 8112], [-20, 5936], [-30, 3760], [-40, 2592], [-50, 1572], [-60, 332], ["∞", 0]];
	const tt = (x) => (window.t ? window.t(x) : x); // Übersetzung der Seite, falls geladen
	const LOCKED_DE = { 70: "Shift", 72: "Std-Wert", 73: "Freigabe", 80: "keine" };
	const LOCKED_TIP = { 70: "Halten: Regler fein, Tasten mit 2. Belegung", 72: "Halten + Regler drücken = Standardwert, + Fader berühren = 0 dB", 73: "Halten = Freigabe für Szene laden, Aufnahme, 48V, EQ flach", 80: "Absichtlich ohne Funktion (Schutz vor Speichern am Pult)" };
	// Tasten der Master-Sektion: [Note, x, y, Breite, Höhe, Original-Beschriftung]
	const KEYS = [
		[40, 1411, 315, 50, 32, "TRACK"], [42, 1472, 315, 50, 32, "PAN/SURROUND"], [44, 1533, 315, 50, 32, "EQ"], [41, 1595, 315, 50, 32, "SEND"], [43, 1656, 315, 50, 32, "PLUG-IN"], [45, 1717, 315, 50, 32, "INST"],
		[52, 1411, 423, 46, 32, "NAME/VALUE"], [53, 1940, 423, 46, 32, "SMPTE/BEATS"],
		[51, 1411, 516, 50, 32, "GLOBAL VIEW"], ...["MIDI TRACKS", "INPUTS", "AUDIO TRACKS", "AUDIO INST", "AUX", "BUSES", "OUTPUTS", "USER"].map((l, i) => [62 + i, 1509 + i * 61.4, 516, 54, 32, l]),
		...Array.from({ length: 8 }, (_, i) => [54 + i, 1509 + i * 61.4, 609, 54, 30, "F" + (i + 1)]),
		[70, 1509, 694, 54, 30, "SHIFT"], [71, 1582, 694, 54, 30, "OPTION"], [72, 1509, 753, 54, 30, "CONTROL"], [73, 1582, 753, 54, 30, "⌥ / ALT"],
		[74, 1652, 694, 58, 30, "READ/OFF"], [75, 1724, 694, 58, 30, "WRITE"], [76, 1795, 694, 58, 30, "TRIM"], [77, 1652, 753, 58, 30, "TOUCH"], [78, 1724, 753, 58, 30, "LATCH"], [79, 1795, 753, 58, 30, "GROUP"],
		[80, 1866, 694, 58, 30, "SAVE"], [81, 1938, 694, 58, 30, "UNDO"], [82, 1866, 753, 58, 30, "CANCEL"], [83, 1938, 753, 58, 30, "ENTER"],
		[84, 1509, 843, 58, 30, "MARKER"], [85, 1580, 843, 58, 30, "NUDGE"], [86, 1652, 843, 58, 30, "CYCLE"], [87, 1724, 843, 58, 30, "DROP"], [88, 1795, 843, 58, 30, "REPLACE"], [89, 1866, 843, 58, 30, "CLICK"], [90, 1938, 843, 58, 30, "SOLO"],
		[91, 1528, 920, 82, 40, "◀◀"], [92, 1626, 920, 82, 40, "▶▶"], [93, 1725, 920, 82, 40, "■"], [94, 1823, 920, 82, 40, "▶"], [95, 1921, 920, 82, 40, "●"],
		[46, 1530, 998, 58, 34, "◀ BANK"], [47, 1600, 998, 58, 34, "BANK ▶"], [48, 1530, 1060, 58, 34, "◀ CHANNEL"], [49, 1600, 1060, 58, 34, "CHANNEL ▶"],
		[101, 1938, 997, 54, 30, "SCRUB"],
		[96, 1566, 1134, 54, 38, "▲"], [98, 1508, 1187, 54, 38, "◀"], [100, 1566, 1187, 54, 38, "ZOOM"], [99, 1624, 1187, 54, 38, "▶"], [97, 1566, 1240, 54, 38, "▼"]
	];
	const BIGNAME = { 91: "REW", 92: "FFWD", 93: "STOP", 94: "PLAY", 95: "REC" };

	function ring(cx, cy, v) {
		const mode = (v >> 4) & 3, pos = v & 15; let o = "";
		for (let i = 1; i <= 11; i++) {
			const a = ((-135 + (i - 1) * 27) * Math.PI) / 180, x = cx + 38 * Math.sin(a), y = cy - 38 * Math.cos(a);
			const on = pos > 0 && (mode === 0 ? i === pos : mode === 1 ? (pos >= 6 ? i >= 6 && i <= pos : i <= 6 && i >= pos) : mode === 2 ? i <= pos : Math.abs(i - 6) <= pos - 1);
			o += `<rect x="${(x - 2.5).toFixed(1)}" y="${(y - 5).toFixed(1)}" width="5" height="10" rx="1.5" fill="${on ? "#ff9a2e" : "#2a2b30"}" transform="rotate(${-135 + (i - 1) * 27} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
		}
		return o;
	}
	// Tasten mit Funktion: dunkler Körper, Funktion in Orange; leuchtend (gedrückt/an): heller bzw. LED-farbiger Körper, dunkle Schrift (Hauke 26.11.2026)
	const FN = "#ff9a2e", BODY = "#35363c", BODY_FREE = "#26272b";
	/** Lange Namen in zwei Zeilen: beim „/“ (bleibt oben) oder beim Leerzeichen nahe der Mitte. */
	function lines(l) {
		if (!l || l.length <= 7) return [l];
		const sp = [...l].map((c, i) => (c === " " ? i : -1)).filter((i) => i > 0).sort((a, b) => Math.abs(a - l.length / 2) - Math.abs(b - l.length / 2))[0];
		if (sp) return [l.slice(0, sp), l.slice(sp + 1)]; // zuerst beim Leerzeichen („Block“ / „an/aus“)
		const sl = l.indexOf("/");
		return sl > 0 && sl < l.length - 1 ? [l.slice(0, sl + 1), l.slice(sl + 1)] : [l];
	}
	/** Text in einer oder zwei Zeilen um (x, y). */
	function label2(x, y, l, size, fill) {
		const L = lines(l);
		if (L.length === 1) return T(x, y + size * 0.38, l, l.length > 9 ? size - 2.5 : l.length > 7 ? size - 1.5 : size, fill, "middle", 700);
		const sz = Math.max(...L.map((x) => x.length)) > 7 ? size - 2 : size - 1;
		return T(x, y - sz * 0.15, L[0], sz, fill, "middle", 700) + T(x, y + sz * 0.95, L[1], sz, fill, "middle", 700);
	}
	let DEMO = false; // Demo: Kanaltasten und Regler anklickbar (opt.demo)
	function stripBtn(x, y, label, st, col, fn, note) {
		const on = st === "on" || st === "blink";
		const body = R(x - 17, y - 13, 34, 26, on ? col : fn ? BODY : "#e9e9ec", on ? "#ffffff" : "#9a9ba1", 5, on ? 'stroke-width="1.5"' : "");
		const t = fn ? label2(x, y, fn, 9.5, on ? "#141414" : FN) : "";
		const cls = [st === "blink" ? "blink" : "", DEMO ? "clk" : ""].filter(Boolean).join(" ");
		return `<g${cls ? ` class="${cls}"` : ""}${DEMO ? ` data-note="${note}" tabindex="0" role="button" aria-label="${esc(label)}"` : ""}>${body}${t}</g>` + T(x, y + 26, label, 10.5, "#d9d9de", "middle", 600);
	}

	window.drawXTouch = function (svg, L, opt = {}) {
		DEMO = !!opt.demo;
		const d = L?.device, keys = L?.keys ?? {}, h = L?.help ?? { push: [] }, shift = !!L?.shiftHeld;
		const led = (n) => d?.leds?.[n] ?? "off";
		let o = R(372, 182, 1622, 1172, "#e8e8ea", null, 46) + R(376, 186, 1614, 1164, "#323338", null, 42);
		o += `<rect x="388" y="196" width="1590" height="48" rx="10" fill="#26272b"/>`; // Lautsprechergitter
		// Kanalzüge
		for (let i = 0; i < 8; i++) {
			const cx = SX(i), x0 = cx - 59, shade = i % 2 ? "#2d2e33" : "#28292d";
			o += R(x0, 255, 118, 1020, shade, "#1f2024", 12);
			o += T(cx, 270, i + 1, 13, "#d9d9de", "middle", 700);
			o += ring(cx, 327, d?.rings?.[i] ?? 0) + `<g${DEMO ? ` class="clk" data-knob="${i}" tabindex="0" role="button" aria-label="Encoder ${i + 1}"` : ""}><circle cx="${cx}" cy="327" r="25" fill="#1d1e22" stroke="#55565c" stroke-width="2"/><circle cx="${cx}" cy="327" r="13" fill="#3a3b40"/></g>`;
			const c = d ? d.colors?.[i] ?? 7 : 0, bg = c === 0 ? "#141416" : XC[c], fg = LIGHT.has(c) ? "#111" : "#fff";
			o += R(cx - 42, 391, 84, 60, bg, "#000", 4) + T(cx, 415, d?.top?.[i] ?? "", 15, fg, "middle", 700, "mono") + T(cx, 441, d?.bottom?.[i] ?? "", 15, fg, "middle", 600, "mono");
			if (h.push?.[i]) o += T(cx, 470, "↓ " + h.push[i], 11, "#ff9a2e", "middle", 600);
			// Pegelkette (oben CLIP, unten SIG)
			o += T(cx - 26, 502, "CLIP", 8.5, "#a9aab0", "middle", 600) + T(cx - 26, 676, "SIG", 8.5, "#a9aab0", "middle", 600);
			const lv = d?.meters?.[i] ?? 0;
			for (let s = 0; s < 8; s++) { const y = 650 - s * 19, lit = s < lv; o += R(cx - 46, y, 8, 13, lit ? (s >= 7 ? "#e24b4a" : s >= 5 ? "#ffd23f" : "#4fbf7a") : "#1b1c1f", null, 2); }
			o += R(cx - 46, 490, 8, 13, d?.clip?.[i] ? "#ff3b30" : "#1b1c1f", null, 2);
			const sx = cx + 22;
			const SF = L?.stripFns?.[i] ?? { rec: "Regler▸", solo: "PAFL", mute: "Mute", select: "Sel" };
			o += stripBtn(sx, 505, "REC", led(i), "#ff5a4d", SF.rec, i) + stripBtn(sx, 560, "SOLO", led(8 + i), "#ffd23f", SF.solo, 8 + i) + stripBtn(sx, 614, "MUTE", led(16 + i), "#ff5a4d", SF.mute, 16 + i) + stripBtn(sx, 668, "SELECT", led(24 + i), "#5ad66f", SF.select, 24 + i);
			// Fader mit Skala
			o += R(cx - 3, 792, 6, 416, "#0d0e10", null, 3);
			for (const [lab, pos] of SCALE) { const y = FY(pos); o += `<line x1="${cx - 30}" x2="${cx - 18}" y1="${y}" y2="${y}" stroke="#77787e" stroke-width="1.5"/><line x1="${cx + 18}" x2="${cx + 30}" y1="${y}" y2="${y}" stroke="#77787e" stroke-width="1.5"/>` + T(cx - 34, y + 4, lab, 10, "#a9aab0", "end", 500); }
			const fy = FY(d?.faders?.[i] ?? 0);
			o += R(cx - 22, fy - 34, 44, 68, "#bfc0c5", "#f2f2f4", 6) + R(cx - 22, fy - 1.5, 44, 3, "#55565c", null, 1);
			o += R(cx - 11, 1242, 22, 20, "#e9e9ec", null, 3) + T(cx, 1257, i + 1, 13, "#1d1d1f", "middle", 700);
		}
		// MAIN-Spalte mit FLIP
		o += R(1352, 570, 118, 705, "#2b2c31", "#1f2024", 12);
		o += btn(50, 1411, 668, 50, 32, "FLIP");
		o += R(1408, 792, 6, 416, "#0d0e10", null, 3);
		for (const [lab, pos] of SCALE) { const y = FY(pos); o += T(1380, y + 4, lab, 10, "#a9aab0", "end", 500) + `<line x1="1385" x2="1397" y1="${y}" y2="${y}" stroke="#77787e" stroke-width="1.5"/>`; }
		const my = FY(d?.faders?.[8] ?? 0);
		o += R(1389, my - 34, 44, 68, "#bfc0c5", "#f2f2f4", 6) + R(1376, 1242, 70, 20, "#e9e9ec", null, 3) + T(1411, 1257, "MAIN", 12, "#1d1d1f", "middle", 800);
		// Master-Sektion: Beschriftung, Gruppenfelder, Anzeigen
		o += T(1375, 262, "UNIVERSAL CONTROL SURFACE", 17, "#e9e9ec", "start", 600) + T(1870, 360, "behringer", 30, "#e9e9ec", "middle", 600);
		o += R(1378, 270, 395, 82, "#26272b", null, 8) + T(1565, 287, "ENCODER ASSIGN", 12, "#e9e9ec", "middle", 700);
		o += R(1378, 375, 600, 92, "#26272b", null, 8) + T(1411, 394, "DISPLAY", 9.5, "#a9aab0", "middle", 600);
		o += R(1447, 400, 72, 46, "#0b0b0c", "#55565c", 4) + T(1483, 434, d?.assign ?? "", 26, "#ff6b3d", "middle", 700, "mono") + T(1483, 458, "ASSIGNMENT", 8.5, "#a9aab0", "middle", 600);
		o += R(1545, 400, 355, 46, "#0b0b0c", "#55565c", 4) + T(1722, 433, d?.timecode ?? "", 24, "#ff6b3d", "middle", 700, "mono") + T(1722, 458, "HOURS · MINUTES · SECONDS · FRAMES", 8.5, "#a9aab0", "middle", 600);
		o += R(1378, 488, 600, 76, "#45464c", null, 8);
		o += R(1480, 572, 498, 72, "#26272b", null, 8) + T(1724, 588, "FUNCTION", 12, "#e9e9ec", "middle", 700);
		o += R(1480, 652, 135, 142, "#26272b", null, 8) + T(1546, 668, "MODIFY", 12, "#e9e9ec", "middle", 700);
		o += R(1620, 652, 210, 142, "#26272b", null, 8) + T(1724, 668, "AUTOMATION", 12, "#e9e9ec", "middle", 700);
		o += R(1835, 652, 143, 142, "#26272b", null, 8) + T(1906, 668, "UTILITY", 12, "#e9e9ec", "middle", 700);
		o += R(1480, 800, 498, 150, "#26272b", null, 8) + T(1724, 816, "TRANSPORT", 12, "#e9e9ec", "middle", 700);
		o += T(1565, 976, "FADER BANK", 10, "#e9e9ec", "middle", 700) + T(1565, 1036, "CHANNEL", 10, "#e9e9ec", "middle", 700);
		o += `<circle cx="1805" cy="1140" r="118" fill="#1d1e22" stroke="#5a5b61" stroke-width="3"/><circle cx="1805" cy="1140" r="96" fill="#2b2c31"/><circle cx="1800" cy="1078" r="18" fill="#1a1b1e"/>` + T(1805, 1146, "Jog", 15, "#a9aab0", "middle", 600) + T(1805, 1164, tt("Auswahl"), 11, "#ff9a2e", "middle", 600);
		for (const k of KEYS) o += btn(...k);
		svg.innerHTML = o;

		function btn(n, x, y, w, hh, name) {
			const b = keys[n], lock = LOCKED_DE[n] && tt(LOCKED_DE[n]);
			const label = lock ?? (b ? (shift && b.shift ? b.shift : b.label) : "");
			const free = !lock && (!b || b.label === "frei" || b.label === tt("frei")) && !(shift && b?.shift);
			const idle = !free && !!b?.idle && !(shift && b?.shift); // wirkt nur in einem anderen Modus
			const st = led(n), on = st === "on" || st === "blink", sel = opt.selected === n;
			const fill = on ? "#ffe2b8" : free ? BODY_FREE : BODY;
			const tc = on ? "#1a1000" : free ? "#6f7076" : idle ? "#9a7a55" : FN;
			const tip = lock ? `${name}: ${tt(LOCKED_TIP[n])}` : b ? `${b.name ?? name}: ${b.full}${b.shiftFull ? ` · ${tt("mit SHIFT")}: ${b.shiftFull}` : ""}` : name;
			const big = BIGNAME[n];
			const cls = [opt.interactive && !lock ? "clk" : "", st === "blink" ? "blink" : ""].filter(Boolean).join(" ");
			let g = `<g data-note="${n}"${cls ? ` class="${cls}"` : ""}${opt.interactive && !lock ? ' tabindex="0" role="button"' : ""} aria-label="${esc(tip)}"><title>${esc(tip)}</title>`;
			g += R(x - w / 2, y - hh / 2, w, hh, fill, sel ? "#4da3ff" : on ? "#ffffff" : "#8e8f95", 6, sel ? 'stroke-width="4"' : on ? 'stroke-width="2"' : "");
			g += label2(x, y, label, 11.5, tc);
			if (b?.shift && !shift && opt.interactive) g += `<circle cx="${x + w / 2 - 5}" cy="${y - hh / 2 + 5}" r="3.5" fill="#3b6fd4"/>`; // hat SHIFT-Belegung
			g += T(x, y + hh / 2 + 13, big ? big : name, big ? 10 : 9.5, "#d9d9de", "middle", 600) + "</g>";
			return g;
		}
	};
})();
