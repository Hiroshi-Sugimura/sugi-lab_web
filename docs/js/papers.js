//////////////////////////////////////////////////////////////////////
//	$Date:: 2016-05-18 15:11:59 +0900#$
//	$Rev: 9609 $
//	Copyright (C) Hiroshi SUGIMURA 2016.05.17 - above.
//////////////////////////////////////////////////////////////////////

var paperData = {};

var journal_index = 1;
var review_index  = 1;
var presen_index  = 1;
var others_index  = 1;


// ï\é¶ï˚éÆ
// var d_format = "cv";
var d_format = "cv";
var d_classify = "yes";

// base
$(document).ready(function () {
	$.getJSON("papers.json", function(data) {
		paperData = data;

		paperData.sort( function(val1,val2){
			var val1 = val1.date;
			var val2 = val2.date;
			if( val1 < val2 ) {
				return 1;
			} else {
				return -1;
			}
		});

		reDraw();
	});
});

function reDraw() {
	// Ç´ÇÍÇ¢Ç…ÇµÇƒ
	journal_index = 1;
	review_index  = 1;
	presen_index  = 1;
	others_index  = 1;
	$("#journal").html("");
	$("#review").html("");
	$("#presentation").html("");
	$("#others").html("");

	if( $("#id_format").val() == "bibtex" ) {
		Object.keys(paperData).forEach(function (n) {
			if( paperData[n].type == "article" ) {
				bibtex_journal( paperData[n] );
			} else if ( paperData[n].type == "review" ) {
				bibtex_review( paperData[n] );
			} else if ( paperData[n].type == "inproceedings" ) {
				bibtex_presen( paperData[n] );
			} else {
				bibtex_others( paperData[n] );
			}
		});
	}else if( $("#id_format").val() == "cv"){
		Object.keys(paperData).forEach(function (n) {
			if( paperData[n].type == "article" ) {
				cv_journal( paperData[n] );
			} else if ( paperData[n].type == "review" ) {
				cv_review( paperData[n] );
			} else if ( paperData[n].type == "inproceedings" ) {
				cv_presen( paperData[n] );
			} else {
				cv_others( paperData[n] );
			}
		});
	}
};


function f_formatOnChange() {
	d_format = $("#format").val();
	d_classify = $("#id_classify").val();

	reDraw();
};


//////////////////////////////////////////////////////////////////////
// bibtexìI

// journal
var bibtex_journal = function(d) {
	$("#journal").html( $("#journal").html() +
						`<h3>${journal_index}. ${d.title}</h3>
							<p>
								@article {,<br>
									title="${d.title}",<br>
										booktitile="${d.booktitle}",<br>
											author="${d.authors}",<br>
												volume="${d.volumes}",<br>
													number="${d.number}",<br>
														pages="${d.pages}",<br>
															year="${d.year}",<br>
																publisher="${d.publisher}",<br>
															}
						</p>`);

	journal_index += 1;
};


// review
var bibtex_review = function(d) {
	$("#review").html( $("#review").html() +
					   `<h3>${review_index}. ${d.title}</h3>
						   <p>
							   @review {,<br>
								   title="${d.title}",<br>
									   booktitile="${d.booktitle}",<br>
										   author="${d.authors}",<br>
											   volume="${d.volumes}",<br>
												   number="${d.number}",<br>
													   pages="${d.pages}",<br>
														   year="${d.year}",<br>
															   publisher="${d.publisher}",<br>
														   }
					   </p>`);
	review_index += 1;
};


// presentation
var bibtex_presen = function(d) {
	$("#presentation").html( $("#presentation").html() +
							 `<h3>${presen_index}. ${d.title}</h3>
								 <p>
									 @presentation {,<br>
										 title="${d.title}",<br>
											 booktitile="${d.booktitle}",<br>
												 author="${d.authors}",<br>
													 volume="${d.volumes}",<br>
														 number="${d.number}",<br>
															 pages="${d.pages}",<br>
																 year="${d.year}",<br>
																	 publisher="${d.publisher}",<br>
																 }
							 </p>`);

	presen_index += 1;
};


// misc
var bibtex_others = function(d) {
	$("#others").html( $("#others").html() +
					   `<h3>${others_index}. ${d.title}</h3>
						   <p>
							   @misc {,<br>
								   title="${d.title}",<br>
									   booktitile="${d.booktitle}",<br>
										   author="${d.authors}",<br>
											   volume="${d.volumes}",<br>
												   number="${d.number}",<br>
													   pages="${d.pages}",<br>
														   year="${d.year}",<br>
															   publisher="${d.publisher}",<br>
														   }
					   </p>`);

	others_index += 1;
};



//////////////////////////////////////////////////////////////////////
// óöóèëìI

// journal
var cv_journal = function(d) {
	let txt = `<p>${journal_index}. ${d.authors}: ${d.title}, ${d.booktitle}, `;
	if( d.volumes != "" ) {
		txt += `Vol.${d.volumes}, `
	}
	if( d.number != "" ) {
		txt += `No.${d.number}, `
	}
	txt += `pp.${d.pages}, ${d.year}.<p>`;

	$("#journal").html( $("#journal").html() + txt);
	journal_index += 1;
};


// review
var cv_review = function(d) {
	let txt = `<p>${review_index}. ${d.authors}: ${d.title}, ${d.booktitle}, `;
	if( d.volumes != "" ) {
		txt += `Vol.${d.volumes}, `
	}
	if( d.number != "" ) {
		txt += `No.${d.number}, `
	}
	txt += `pp.${d.pages}, ${d.year}.<p>`;

	$("#review").html( $("#review").html() + txt);
	review_index += 1;
};


// presentation
var cv_presen = function(d) {
	let txt = `<p>${presen_index}. ${d.authors}: ${d.title}, ${d.booktitle}, `;
	if( d.volumes != "" ) {
		txt += `Vol.${d.volumes}, `
	}
	if( d.number != "" ) {
		txt += `No.${d.number}, `
	}
	txt += `pp.${d.pages}, ${d.year}.<p>`;

	$("#presentation").html( $("#presentation").html() + txt);
	presen_index += 1;
};


// misc
var cv_others = function(d) {
	let txt = `<p>${others_index}. ${d.authors}: ${d.title}, ${d.booktitle}, `;
	if( d.volumes != "" ) {
		txt += `Vol.${d.volumes}, `
	}
	if( d.number != "" ) {
		txt += `No.${d.number}, `
	}
	txt += `pp.${d.pages}, ${d.year}.<p>`;

	$("#others").html( $("#others").html() + txt);
	others_index += 1;
};

