(function () {
  "use strict";

  const base = window.ONLINE_AX_CONFIG;
  if (!base) {
    throw new Error("Base AX test configuration must be loaded before the Vietnamese overlay.");
  }

  window.ONLINE_AX_CONFIG = Object.freeze({
    ...base,
    task: Object.freeze({
      ...base.task,
      task_label: "So sánh hai âm thanh"
    }),
    locale: Object.freeze({
      language: "vi",
      html_lang: "vi",
      instruction_revision: "vi_same_different_v1_unchanged_2026-09-24",
      document_title: "So sánh hai âm thanh — Kiểm tra kỹ thuật"
    }),
    participant_information: Object.freeze({
      ...base.participant_information,
      label: "Xem bản thông tin dành cho người tham gia"
    }),
    setup_audio: Object.freeze({
      ...base.setup_audio,
      language: "vi",
      url: base.setup_audio.alternate_vi_url,
      source_url: base.setup_audio.source_alternate_vi_url
    }),
    text: Object.freeze({
      ...base.text,
      welcome_kicker: "Thí nghiệm tiếng Việt",
      welcome_title: "Cảm ơn và chào mừng bạn!",
      welcome_lead: "Cảm ơn bạn đã dành thời gian tham gia nghiên cứu này. Toàn bộ nhiệm vụ được thực hiện trực tuyến và bạn sẽ được hướng dẫn từng bước.",
      welcome_button: "Tiếp tục",
      initial_scroll_note: "Ở một số màn hình hướng dẫn ban đầu, bạn có thể cần kéo xuống để đọc hết nội dung. Sau khi các phím S và L được giới thiệu, bạn chỉ cần dùng bàn phím để tiếp tục.",

      consent_kicker: "Chuẩn bị",
      consent_title: "Trước khi tiếp tục",
      consent_lead: "Trước khi bắt đầu, vui lòng đảm bảo rằng bạn đã đọc thông tin về nghiên cứu đã được cung cấp cho bạn.",
      consent_acknowledgement: "Bằng cách nhấn Xác nhận, bạn xác nhận đã đọc và hiểu thông tin về nghiên cứu đã được cung cấp cho bạn, đồng thời đồng ý tham gia theo các điều kiện được trình bày.",
      consent_button: "Xác nhận",
      participant_information_placeholder_suffix: "— liên kết sẽ được bổ sung trước khi triển khai",

      technical_code: Object.freeze({
        title: "Mã tham gia của bạn",
        kicker: "Chế độ kiểm tra kỹ thuật",
        instruction: "Nhập mã kiểm tra được cung cấp cho phiên này.",
        input_label: "Mã tham gia",
        continue_label: "Tiếp tục",
        hint: "Dùng mã theo định dạng người tham gia với ba chữ số cuối từ 990 đến 999."
      }),

      preload_message: "Đang chuẩn bị âm thanh…",

      setup_kicker: "Chuẩn bị",
      setup_title: "Chuẩn bị không gian xung quanh",
      setup_lead: "Vui lòng thoả mãn các điều kiện dưới đây.",
      setup_audio_title: "Nghe hướng dẫn và điều chỉnh âm lượng",
      setup_audio_instruction: "Trong khi nghe thông báo này, hãy điều chỉnh âm lượng cho đến khi bạn nghe giọng nói rõ ràng. Bạn có thể nghe lại nếu cần.",
      setup_audio_button: "▶ Nghe hướng dẫn",
      setup_audio_playing: "Đang phát hướng dẫn…",
      setup_audio_ready: "Đã nghe hướng dẫn. Bạn có thể nghe lại nếu cần.",
      setup_audio_error: "Không thể phát hướng dẫn bằng âm thanh. Hãy kiểm tra thiết bị phát âm thanh rồi thử lại.",
      setup_audio_warning: "Sau khi đã điều chỉnh xong, vui lòng không thay đổi âm lượng của máy tính, trình duyệt hoặc tai nghe trong suốt thí nghiệm.",
      setup_conditions: Object.freeze([
        "Tôi đang dùng tai nghe và KHÔNG dùng loa của máy tính.",
        "Tôi đang ở nơi yên tĩnh và có thể tiếp tục thí nghiệm này mà không bị gián đoạn.",
        "Tôi đang dùng máy tính có bàn phím vật lý và đã tắt thông báo cũng như các nguồn âm thanh khác.",
        "Hiện tại tôi không gặp khó khăn bất thường khi nghe một cuộc trò chuyện thông thường.",
        "Tôi đã điều chỉnh âm lượng ở mức phù hợp và sẽ không thay đổi âm lượng trong suốt phần còn lại của thí nghiệm."
      ]),
      setup_button: "Tiếp tục",
      setup_blocked_note: "Hãy nghe hướng dẫn ít nhất một lần và xác nhận từng điều kiện trước khi tiếp tục.",

      intro_kicker: "Hướng dẫn",
      intro_title: "Hai âm thanh giống nhau hay khác nhau?",
      intro_lead: "Vui lòng nghe hết cả hai âm trước khi trả lời.",
      continue_label: "Tiếp tục",
      trial_timing_title: "Một lượt diễn ra như thế nào?",
      trial_timing_steps: Object.freeze([
        Object.freeze({ title: "Dấu + xuất hiện", text: "Kí hiệu này báo hiệu một lượt mới sắp bắt đầu." }),
        Object.freeze({ title: "Nghe âm thứ nhất", text: "Chưa trả lời." }),
        Object.freeze({ title: "Chờ trong lúc không có âm thanh", text: "" }),
        Object.freeze({ title: "Nghe hết âm thứ hai", text: "Câu trả lời của bạn chỉ được ghi nhận sau khi âm thứ hai kết thúc." }),
        Object.freeze({ title: "Trả lời", text: "Hai âm vừa nghe giống hay khác nhau? Nhấn phím tương ứng để trả lời. Hướng dẫn ở trang tiếp theo." })
      ]),
      trial_timing_note: "",
      response_title: "Hướng dẫn trả lời: Hai âm giống hay khác nhau?",
      response_deadline_note: "",
      response_steps: Object.freeze([
        Object.freeze({ title: "S = giống nhau", text: "Dùng ngón trỏ tay trái." }),
        Object.freeze({ title: "L = khác nhau", text: "Dùng ngón trỏ tay phải." }),
        Object.freeze({ title: "Trả lời sau âm thứ hai", text: "Nếu bạn nhấn quá sớm, lần nhấn đó sẽ bị bỏ qua; hãy nhấn lại sớm nhất có thể." })
      ]),
      finger_instruction: "Đặt ngón trỏ tay trái lên phím S và ngón trỏ tay phải lên phím L trước khi bắt đầu mỗi phần của thí nghiệm, rồi giữ các ngón tay ở các phím này trong suốt mỗi phần của thí nghiệm.",
      keyboard_check_kicker: "Kiểm tra bàn phím",
      key_check_s_title: "Kiểm tra phím S",
      key_check_s_text: "Đặt ngón trỏ tay trái lên phím S, rồi nhấn phím này một lần.",
      key_check_l_title: "Kiểm tra phím L",
      key_check_l_text: "Đặt ngón trỏ tay phải lên phím L, rồi nhấn phím này một lần.",
      key_choices_aria_label: "Các phím trả lời",

      practice_title: "Làm quen với thí nghiệm",
      practice_lead: "Bạn sẽ có 6 lượt luyện tập. Sau mỗi lượt, bạn sẽ nhận được phản hồi ngắn: chính xác / không chính xác.",
      practice_steps: Object.freeze([
        Object.freeze({ title: "Quy tắc", text: "Nghe hết cả hai âm, rồi chọn Giống nhau hoặc Khác nhau." }),
        Object.freeze({ title: "Phím trả lời", text: "Ngón trỏ trái trên phím S; ngón trỏ phải trên phím L." })
      ]),
      practice_start_button: "Bắt đầu luyện tập",
      practice_complete_title: "Đã hoàn thành phần luyện tập",
      practice_complete_lead: "Phần chính sẽ bắt đầu ngay sau đây. Đặt lại ngón trỏ tay trái lên phím S và ngón trỏ tay phải lên phím L.",
      practice_complete_button: "Bắt đầu phần chính",
      practice_feedback_timeout: "Không ghi nhận được câu trả lời.",
      practice_feedback_correct: "Chính xác.",
      practice_feedback_incorrect_same: "Không chính xác. Đáp án là “Giống nhau”.",
      practice_feedback_incorrect_different: "Không chính xác. Đáp án là “Khác nhau”.",
      guided_practice_kicker: "Lượt luyện tập đầu tiên",
      guided_practice_display_kicker: "Luyện tập",
      guided_practice_title: "Hãy trả lời theo hướng dẫn",
      guided_practice_question: "Hai âm vừa nghe giống nhau hay khác nhau?",
      guided_practice_same_instruction: "Nếu giống nhau, nhấn phím S bằng ngón trỏ tay trái.",
      guided_practice_different_instruction: "Nếu khác nhau, nhấn phím L bằng ngón trỏ tay phải.",
      guided_practice_self_paced_note: "Ở lượt đầu tiên này, bạn có thể dành thời gian để chọn câu trả lời.",
      guided_practice_ready_title: "Bạn đã sẵn sàng cho các lượt tiếp theo?",
      guided_practice_ready_lead: "Từ lượt tiếp theo, vui lòng trả lời trong vòng 2 giây sau khi âm thứ hai kết thúc.",
      guided_practice_deadline_token: "2 giây",

      block_title: "Phần",
      block_counter_separator: "/",
      block_practice_suffix: "luyện tập",
      block_rest_title_first: "Bạn đã sẵn sàng?",
      block_rest_title_next: "Sẵn sàng tiếp tục?",
      block_rest_lead: "Nếu cần, bạn có thể nghỉ một chút. Chỉ tiếp tục khi bạn sẵn sàng tập trung trong suốt mỗi phần của thí nghiệm.",
      block_intro_steps: Object.freeze([
        Object.freeze({ title: "Nghỉ một chút nếu cần", text: "Chỉ bắt đầu khi bạn sẵn sàng tiếp tục." }),
        Object.freeze({ title: "Đặt lại vị trí các ngón tay", text: "Ngón trỏ trái trên phím S; ngón trỏ phải trên phím L." }),
        Object.freeze({ title: "Giữ nguyên âm lượng", text: "Giữ tai nghe ổn định và không thay đổi âm lượng." })
      ]),
      block_start_button: "Bắt đầu thí nghiệm",
      resume_button: "Tiếp tục",
      mini_break_title: "Nghỉ một chút",
      mini_break_lead: "Bạn đã hoàn thành phần này của thí nghiệm. Nếu cần, hãy nghỉ một chút rồi tiếp tục khi bạn đã sẵn sàng.",
      mini_break_steps: Object.freeze([
        Object.freeze({ title: "Nghỉ nếu cần", text: "Bạn có thể nghỉ trong khoảng thời gian mình cần." }),
        Object.freeze({ title: "Trước khi tiếp tục", text: "Đặt lại hai ngón trỏ lên S và L và giữ nguyên âm lượng." })
      ]),
      block_reminder: "Giữ tai nghe ổn định và không thay đổi âm lượng.",
      first_sound_label: "Âm thứ nhất",
      second_sound_label: "Âm thứ hai",
      listen_label: "Hãy nghe",
      response_question: "Hai âm vừa nghe giống nhau hay khác nhau?",
      response_wait: "Chỉ trả lời sau khi âm thứ hai kết thúc.",
      same_label: "Giống nhau",
      different_label: "Khác nhau",
      same_detail: "S · ngón trỏ trái",
      different_detail: "L · ngón trỏ phải",
      break_title: "Nghỉ giải lao",
      break_paragraphs: Object.freeze([
        "Bạn đã hoàn thành phần này.",
        "Nếu cần, hãy dành thời gian nghỉ một chút. Giữ nguyên mức âm lượng và tiếp tục khi bạn đã sẵn sàng."
      ]),
      completion_title: "Cảm ơn bạn đã tham gia",
      completion_paragraphs: Object.freeze([
        "Phiên kiểm tra ngắn này đã kết thúc."
      ]),
      save_success: "Dữ liệu kiểm tra kỹ thuật đã được lưu thành công.",
      save_failure_prefix: "Không thể lưu dữ liệu kiểm tra kỹ thuật:",
      save_unknown_error: "lỗi không xác định"
    })
  });
})();
